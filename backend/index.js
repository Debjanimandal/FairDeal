const express = require("express");
const multer = require("multer");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const Jimp = require("jimp");
const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");
const StellarSdk = require("@stellar/stellar-sdk");
const { exec } = require("child_process");
const AdmZip = require("adm-zip");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload config
const upload = multer({ storage: multer.memoryStorage() });

// In-memory job storage (for MVP)
const jobStorage = new Map();
const jobFiles = new Map();
const fraudFlags = new Map(); // Track fraud flags by freelancer address

// IPFS persistence
let latestJobsIPFSCID = null; // Track the latest CID for jobs database

// Initialize Pinata
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);

// Initialize Stellar
const stellarServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

/**
 * Release funds from escrow to freelancer
 */
async function releaseFundsToFreelancer(jobId) {
  try {
    const job = jobStorage.get(jobId);
    if (!job) throw new Error("Job not found");

    // Calculate remaining amount (total - initial payment already sent)
    const totalAmount = parseFloat(job.amount);
    const initialPaymentPercent = job.initialPaymentPercent || 10;
    const initialPayment = (totalAmount * initialPaymentPercent) / 100;
    const remainingAmount = (totalAmount - initialPayment).toFixed(7);

    console.log(`💰 Releasing ${remainingAmount} XLM from escrow to freelancer`);

    // Load escrow keypair
    const escrowKeypair = StellarSdk.Keypair.fromSecret(process.env.ESCROW_SECRET_KEY);

    // Load escrow account
    const escrowAccount = await stellarServer.loadAccount(escrowKeypair.publicKey());

    // Build payment transaction
    const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.freelancer,
          asset: StellarSdk.Asset.native(),
          amount: remainingAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text("FairDeal Release"))
      .setTimeout(180)
      .build();

    // Sign with escrow key
    transaction.sign(escrowKeypair);

    // Submit to network
    const result = await stellarServer.submitTransaction(transaction);
    console.log("✅ Funds released! Transaction:", result.hash);

    return result.hash;
  } catch (error) {
    console.error("Error releasing funds:", error);
    throw error;
  }
}

/**
 * Refund remaining funds from escrow to client
 */
async function refundFundsToClient(jobId) {
  try {
    const job = jobStorage.get(jobId);
    if (!job) throw new Error("Job not found");

    // Calculate remaining amount (total - initial payment already sent)
    const totalAmount = parseFloat(job.amount);
    const initialPaymentPercent = job.initialPaymentPercent || 10;
    const initialPayment = (totalAmount * initialPaymentPercent) / 100;
    const remainingAmount = (totalAmount - initialPayment).toFixed(7);

    console.log(`💸 Refunding ${remainingAmount} XLM from escrow to client`);

    // Load escrow keypair
    const escrowKeypair = StellarSdk.Keypair.fromSecret(process.env.ESCROW_SECRET_KEY);

    // Load escrow account
    const escrowAccount = await stellarServer.loadAccount(escrowKeypair.publicKey());

    // Build payment transaction
    const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: job.client,
          asset: StellarSdk.Asset.native(),
          amount: remainingAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text("FairDeal Refund"))
      .setTimeout(180)
      .build();

    // Sign with escrow key
    transaction.sign(escrowKeypair);

    // Submit to network
    const result = await stellarServer.submitTransaction(transaction);
    console.log("✅ Refund complete! Transaction:", result.hash);

    return result.hash;
  } catch (error) {
    console.error("Error refunding:", error);
    throw error;
  }
}

/**
 * Encryption utilities
 */
class EncryptionManager {
  generateKey() {
    return crypto.randomBytes(32);
  }

  generateIV() {
    return crypto.randomBytes(16);
  }

  encryptFile(fileBuffer, key) {
    const iv = this.generateIV();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      encrypted,
      iv,
      key,
    };
  }

  decryptFile(encryptedBuffer, key, iv) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  }
}

const encryptionManager = new EncryptionManager();

/**
 * Watermarking utilities
 */
class WatermarkManager {
  async addWatermark(imageBuffer, text) {
    try {
      const image = await Jimp.read(imageBuffer);

      // Load default font
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

      // Add watermark text
      image.print(
        font,
        10,
        10,
        {
          text: `${text} - PREVIEW ONLY`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP,
        },
        image.bitmap.width - 20,
        image.bitmap.height - 20
      );

      // Reduce opacity by adding semi-transparent overlay
      const watermarkOverlay = new Jimp(image.bitmap.width, image.bitmap.height, 0x00000044);
      image.blit(watermarkOverlay, 0, 0);

      return image.getBuffer("image/jpeg");
    } catch (error) {
      console.log("Watermarking failed, returning original:", error.message);
      // For non-image files, just return original
      return imageBuffer;
    }
  }
}



const watermarkManager = new WatermarkManager();

/**
 * Code Execution Utilities
 */
class CodeExecutionManager {
  async executeCode(files) {
    // Create a temporary directory
    const tempDir = path.join(__dirname, "temp_execution", `job-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write files to temp dir
      for (const file of files) {
        const filePath = path.join(tempDir, file.originalname);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.buffer);
      }

      // Detect and run
      let command = "";
      if (fs.existsSync(path.join(tempDir, "package.json"))) {
        // Simple install and test/run
        command = `cd "${tempDir}" && npm install && (npm test || node index.js)`;
      } else if (fs.existsSync(path.join(tempDir, "main.py"))) {
        command = `cd "${tempDir}" && python main.py`;
      } else if (fs.existsSync(path.join(tempDir, "index.js"))) {
        command = `cd "${tempDir}" && node index.js`;
      } else if (fs.existsSync(path.join(tempDir, "App.java"))) {
        command = `cd "${tempDir}" && javac App.java && java App`;
      } else if (fs.existsSync(path.join(tempDir, "index.html"))) {
        // Serve HTML directly
        const htmlContent = fs.readFileSync(path.join(tempDir, "index.html"), "utf-8");
        // Cleanup immediately
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }

        return { type: "html", output: htmlContent };
      } else {
        // Check for any HTML file if index.html is missing
        const htmlFile = files.find(f => f.originalname.endsWith(".html"));
        if (htmlFile) {
          const htmlContent = htmlFile.buffer.toString("utf-8");
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
          return { type: "html", output: htmlContent };
        }

        return { type: "unknown", output: "No runnable entry point found (package.json, main.py, index.js, App.java). Submitted files: " + files.map(f => f.originalname).join(", ") };
      }

      // Execute
      return new Promise((resolve) => {
        exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
          // Cleanup
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) { console.error("Cleanup error", e); }

          if (error) {
            // Return stdout/stderr even on error as it might contain useful info
            resolve({ type: "error", output: `Execution Error: ${error.message}\n\nOutput:\n${stdout}\n\nErrors:\n${stderr}` });
          } else {
            resolve({ type: "success", output: stdout || "Execution completed with no output." });
          }
        });
      });

    } catch (err) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) { }
      return { type: "error", output: err.message };
    }
  }
}

const codeExecutionManager = new CodeExecutionManager();

async function createZipFromFiles(files) {
  const zip = new AdmZip();
  for (const file of files) {
    zip.addFile(file.originalname, file.buffer);
  }
  return zip.toBuffer();
}




/**
 * IPFS upload utilities using Pinata
 */
async function uploadToIPFS(fileBuffer, filename) {
  try {
    const options = {
      pinataMetadata: {
        name: filename,
      },
      pinataOptions: {
        cidVersion: 0 // Compatible with standard IPFS CIDs
      }
    };

    // Create a readable stream from buffer
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const result = await pinata.pinFileToIPFS(bufferStream, options);
    return result.IpfsHash; // This is the CID
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * IPFS Database Persistence Functions
 */

// Save all jobs to IPFS
async function saveJobsToIPFS() {
  try {
    // Convert Map to array for JSON
    const jobsArray = Array.from(jobStorage.entries()).map(([id, job]) => job);

    const jobsData = {
      jobs: jobsArray,
      lastUpdated: new Date().toISOString(),
      totalJobs: jobsArray.length,
    };

    // Convert to JSON
    const jsonString = JSON.stringify(jobsData, null, 2);
    const buffer = Buffer.from(jsonString);

    // Upload to Pinata
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const options = {
      pinataMetadata: {
        name: `fairdeal-jobs-${Date.now()}.json`,
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinFileToIPFS(bufferStream, options);
    latestJobsIPFSCID = result.IpfsHash;

    console.log(`✅ Jobs saved to IPFS: ${latestJobsIPFSCID}`);
    console.log(`📊 Saved ${jobsArray.length} jobs`);

    return latestJobsIPFSCID;
  } catch (error) {
    console.error("❌ Error saving jobs to IPFS:", error.message);
    return null;
  }
}

// Load jobs from IPFS
async function loadJobsFromIPFS(cid) {
  try {
    if (!cid) {
      console.log("ℹ️ No CID provided, starting with empty database");
      return;
    }

    console.log(`📥 Loading jobs from IPFS: ${cid}`);

    // Fetch from IPFS gateway
    const axios = require('axios');
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);

    const jobsData = response.data;

    // Restore jobs to Map
    jobsData.jobs.forEach(job => {
      jobStorage.set(job.id, job);
    });

    latestJobsIPFSCID = cid;

    console.log(`✅ Loaded ${jobsData.jobs.length} jobs from IPFS`);
    console.log(`📅 Last updated: ${jobsData.lastUpdated}`);

    return jobsData.jobs.length;
  } catch (error) {
    console.error("❌ Error loading jobs from IPFS:", error.message);
    return 0;
  }
}

/**
 * Routes
 */

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * POST /api/jobs
 * Create a new job
  * Body: client, freelancer, amount, deadline, description, transactionHash
 */
app.post("/api/jobs", (req, res) => {
  try {
    const { client, freelancer, amount, deadline, description, transactionHash, initialPaymentPercent, initialPaymentReleased } = req.body;

    if (!client || !freelancer || !amount || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate job ID
    const jobId = Date.now().toString();

    // Create job object
    const job = {
      id: jobId,
      client,
      freelancer,
      amount: parseFloat(amount),
      deadline,
      description,
      state: 0, // Created
      createdAt: new Date().toISOString(),
      transactionHash: transactionHash || null, // Store Stellar transaction hash for initial payment
      paymentConfirmed: !!transactionHash, // Flag if payment was made
      initialPaymentPercent: initialPaymentPercent || 10, // Default 10%
      initialPaymentReleased: initialPaymentReleased || false, // Track if initial payment sent
      fraudFlagRaised: false,
      fraudFlagTimestamp: null,
    };

    // Store in memory
    jobStorage.set(jobId, job);

    console.log(`Job created: ${jobId} by ${client}`);
    if (transactionHash) {
      console.log(`💰 Payment transaction: ${transactionHash}`);
    }

    // Auto-save to IPFS for persistence
    saveJobsToIPFS().then(cid => {
      if (cid) {
        console.log(`💾 Database persisted to IPFS`);
      }
    }).catch(err => {
      console.error("Warning: IPFS save failed:", err.message);
    });

    res.json({
      success: true,
      job,
      ipfsCID: latestJobsIPFSCID,
      message: transactionHash
        ? "Job created successfully with payment confirmation"
        : "Job created successfully",
    });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/escrow-address
 * Get the escrow wallet public address
 */
app.get("/api/escrow-address", (req, res) => {
  try {
    res.json({
      success: true,
      escrowAddress: process.env.ESCROW_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Error getting escrow address:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs
 * List all jobs
 */
app.get("/api/jobs", (req, res) => {
  try {
    const jobs = Array.from(jobStorage.values());
    res.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error("Error listing jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:jobId
 * Get a specific job
 */
app.get("/api/jobs/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStorage.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error getting job:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/submit-work
 * Submit work for a job - supports both folder upload (multiple files) and single file
 * Body: jobId, freelancerAddress, files[]
 */
app.post("/api/jobs/submit-work", upload.array("files[]", 50), async (req, res) => {
  try {
    const { jobId, freelancerAddress } = req.body;
    const files = req.files;

    if (!jobId || !files || files.length === 0) {
      return res.status(400).json({ error: "Missing jobId or files" });
    }

    const job = jobStorage.get(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.state !== 0 && job.state !== 4) {
      return res.status(400).json({ error: "Cannot submit work. Contract is not in a submittable state." });
    }

    console.log(`📁 Processing ${files.length} file(s) for job ${jobId}`);

    // Check for code submission (Folder OR single non-image file)
    const isImage = files.length === 1 && files[0].mimetype.startsWith('image/');
    const isCodeSubmission = !isImage;

    let originalBuffer, previewBuffer, fileName, previewCID;
    let previewText = '';

    if (isCodeSubmission) {
      console.log(`💻 Code submission detected (${files.length} files)`);

      // Even for single code file, we ZIP it for consistent encryption/download
      const zipBuffer = await createZipFromFiles(files);
      originalBuffer = zipBuffer;
      fileName = files.length > 1 ? `code-${jobId}.zip` : `${files[0].originalname}.zip`;

      const executionResult = await codeExecutionManager.executeCode(files);
      console.log(`✅ Code execution completed: ${executionResult.type}`);

      previewText = executionResult.output; // Store as text
    } else {
      console.log(`� Image submission detected: ${files[0].originalname}`);
      originalBuffer = files[0].buffer;
      fileName = files[0].originalname;
      previewBuffer = await watermarkManager.addWatermark(files[0].buffer, `Job ${jobId}`);

      // For image files, upload watermarked image to IPFS
      previewCID = await uploadToIPFS(previewBuffer, `${jobId}-preview-${Date.now()}`);
      console.log(`👁️ Preview uploaded to IPFS: ${previewCID}`);
      previewText = `Preview available at: https://gateway.pinata.cloud/ipfs/${previewCID}`;
    }

    const encryptionKey = encryptionManager.generateKey();
    const encrypted = encryptionManager.encryptFile(originalBuffer, encryptionKey);

    const originalCID = await uploadToIPFS(encrypted.encrypted, `${jobId}-original-${Date.now()}`);
    console.log(`📦 Encrypted original uploaded to IPFS: ${originalCID}`);

    jobFiles.set(jobId, {
      jobId,
      freelancerAddress,
      originalCID,
      previewCID: previewCID || null,
      previewText: previewText, // Store preview text instead of CID
      encryptionKey: encryptionKey.toString("hex"),
      encryptionIV: encrypted.iv.toString("hex"),
      submittedAt: new Date().toISOString(),
      fileName: fileName,
      fileSize: originalBuffer.length,
      isCodeFolder: isCodeSubmission, // Rename/Reuse property for "Code Mode"
      fileCount: files.length,
    });

    if (job) {
      job.state = 1;
      jobStorage.set(jobId, job);
      console.log(`✅ Job ${jobId} state updated to 1 (Submitted)`);
    }

    res.json({
      success: true,
      jobId,
      previewURL: `http://localhost:5000/api/jobs/${jobId}/preview-content`,
      isCodeFolder: isCodeSubmission,
      fileCount: files.length,
      message: isCodeSubmission
        ? `Code submission (${files.length} files) successful. Preview available via backend API.`
        : "Work submitted successfully. Preview is visible to client.",
    });
  } catch (error) {
    console.error("Error submitting work:", error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/jobs/:jobId/preview
 * Get preview CID and metadata
 */
/**
 * GET /api/jobs/:jobId/preview-content
 * Serve raw preview content (text)
 */
app.get("/api/jobs/:jobId/preview-content", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).send("Job data not found");
    }

    if (jobData.previewText) {
      if (jobData.previewText.trim().startsWith("<!DOCTYPE") || jobData.previewText.trim().startsWith("<html")) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      res.send(jobData.previewText);
    } else {
      res.status(404).send("No text preview available");
    }
  } catch (error) {
    console.error("Error serving preview content:", error);
    res.status(500).send("Error serving preview");
  }
});

/**
 * GET /api/jobs/:jobId/preview
 * Get preview metadata (JSON) used by frontend to check status
 */
app.get("/api/jobs/:jobId/preview", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Always return JSON metadata
    res.json({
      jobId,
      // If it's a code folder, point to the content endpoint
      // If it has previewText (code submission), point to local content
      previewURL: jobData.previewText && !jobData.previewText.startsWith("Preview available")
        ? `http://localhost:5000/api/jobs/${jobId}/preview-content`
        : `https://gateway.pinata.cloud/ipfs/${jobData.previewCID}`,
      fileName: jobData.fileName,
      submittedAt: jobData.submittedAt,
      isCodeFolder: jobData.isCodeFolder,
      message: "Preview is ready.",
    });
  } catch (error) {
    console.error("Error getting preview:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:jobId/approve
 * Approve job and reveal original file details
 * Can only be called after smart contract approves
 */
app.post("/api/jobs/:jobId/approve", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStorage.get(jobId);
    const jobData = jobFiles.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.state !== 1) {
      return res.status(400).json({ error: "Job must be in submitted state" });
    }

    // Release remaining funds from escrow to freelancer
    const releaseTransactionHash = await releaseFundsToFreelancer(jobId);

    // Update job state
    job.state = 2; // Approved
    job.releaseTransactionHash = releaseTransactionHash;
    job.approvedAt = new Date().toISOString();
    jobStorage.set(jobId, job);

    // Also mark file data as approved if exists
    if (jobData) {
      jobData.approved = true;
      jobData.approvedAt = new Date().toISOString();
      jobFiles.set(jobId, jobData);
    }

    console.log(`✅ Job ${jobId} approved! Funds released to freelancer`);

    res.json({
      success: true,
      message: "Job approved and funds released to freelancer",
      jobId,
      releaseTransactionHash,
      originalCID: jobData?.originalCID,
      originalURL: jobData ? `https://gateway.pinata.cloud/ipfs/${jobData.originalCID}` : null,
      decryptionKey: jobData?.encryptionKey,
      decryptionIV: jobData?.encryptionIV,
    });
  } catch (error) {
    console.error("Error approving job:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:jobId/reject
 * Reject job and refund funds to client
 */
app.post("/api/jobs/:jobId/reject", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { type } = req.body; // 'request_changes' or 'final_reject'

    const job = jobStorage.get(jobId);
    const jobData = jobFiles.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.state !== 1) {
      return res.status(400).json({ error: "Job must be in submitted state" });
    }

    // Default to 'request_changes' if not specified (safer default)
    const rejectType = type || 'request_changes';

    if (rejectType === 'final_reject') {
      // 1. FINAL REJECTION -> REFUND CLIENT
      // Refund remaining funds from escrow to client
      const refundTransactionHash = await refundFundsToClient(jobId);

      // Update job state
      job.state = 3; // Rejected (Final)
      job.refundTransactionHash = refundTransactionHash;
      job.rejectedAt = new Date().toISOString();
      jobStorage.set(jobId, job);

      // Mark file data as rejected if exists
      if (jobData) {
        jobData.rejected = true;
        jobData.rejectedAt = new Date().toISOString();
        jobFiles.set(jobId, jobData);
      }

      console.log(`❌ Job ${jobId} rejected (FINAL)! Funds refunded to client`);

      res.json({
        success: true,
        message: "Job rejected and funds refunded to client",
        jobId,
        refundTransactionHash,
        status: "rejected"
      });

    } else {
      // 2. REQUEST CHANGES -> ALLOW RESUBMISSION (NO REFUND)

      // Update job state to 4 (Revision Requested)
      job.state = 4; // Revision Requested
      job.revisionRequestedAt = new Date().toISOString();
      // Reset submitted flag? Maybe not needed if we track state
      jobStorage.set(jobId, job);

      console.log(`↩️ Job ${jobId} revision requested. Funds remain in escrow.`);

      res.json({
        success: true,
        message: "Revision requested. Freelancer can resubmit.",
        jobId,
        status: "revision_requested"
      });
    }

  } catch (error) {
    console.error("Error rejecting job:", error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/jobs/:jobId/status
 * Get job submission status
 */
app.get("/api/jobs/:jobId/status", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).json({ status: "not_submitted" });
    }

    const status = {
      jobId,
      submitted: true,
      submittedAt: jobData.submittedAt,
      fileName: jobData.fileName,
      approved: jobData.approved || false,
      rejected: jobData.rejected || false,
    };

    res.json(status);
  } catch (error) {
    console.error("Error getting status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:jobId/release-initial-payment
 * Release initial payment to freelancer
 */
app.post("/api/jobs/:jobId/release-initial-payment", (req, res) => {
  try {
    const { jobId } = req.params;
    const { clientAddress } = req.body;
    const job = jobStorage.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.client !== clientAddress) {
      return res.status(403).json({ error: "Unauthorized: Only client can release payment" });
    }

    if (job.initialPaymentReleased) {
      return res.status(400).json({ error: "Initial payment already released" });
    }

    // Mark initial payment as released
    job.initialPaymentReleased = true;
    job.initialPaymentReleasedAt = new Date().toISOString();
    jobStorage.set(jobId, job);

    // Calculate initial payment amount
    const initialAmount = (job.amount * job.initialPaymentPercent) / 100;

    console.log(`💰 Initial payment released for job ${jobId}: ${initialAmount} (${job.initialPaymentPercent}%)`);

    // Auto-save to IPFS
    saveJobsToIPFS().catch(err => {
      console.error("Warning: IPFS save failed:", err.message);
    });

    res.json({
      success: true,
      jobId,
      initialAmount,
      percentage: job.initialPaymentPercent,
      remainingAmount: job.amount - initialAmount,
      message: `Initial payment of ${initialAmount} released to freelancer`,
    });
  } catch (error) {
    console.error("Error releasing initial payment:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:jobId/raise-fraud-flag
 * Raise fraud flag on freelancer
 */
app.post("/api/jobs/:jobId/raise-fraud-flag", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { clientAddress } = req.body;
    const job = jobStorage.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Verify client is the one raising flag
    if (job.client !== clientAddress) {
      return res.status(403).json({ error: "Only the client can raise a fraud flag" });
    }

    if (job.fraudFlagRaised) {
      return res.status(400).json({ error: "Fraud flag already raised" });
    }

    // New logic: Auto-refund and terminate contract
    console.log(`🚨 Fraud flag raised on job ${jobId}. Initiating refund and termination.`);

    // 1. Refund remaining funds from escrow to client
    const refundTransactionHash = await refundFundsToClient(jobId);

    // 2. Update job state
    job.fraudFlagRaised = true;
    job.fraudFlagTimestamp = new Date().toISOString();
    job.state = 3; // Rejected / Terminated
    job.refundTransactionHash = refundTransactionHash;
    job.rejectedAt = new Date().toISOString(); // Treating fraud as a form of rejection/termination

    jobStorage.set(jobId, job);

    // Save fraud record
    fraudReportStorage.set(`${jobId}-${clientAddress}`, {
      jobId,
      client: clientAddress,
      freelancer: job.freelancer,
      timestamp: new Date().toISOString(),
      amount: job.amount,
      description: job.description,
    });

    console.log(`🚨 Job ${jobId} terminated due to fraud flag. Funds refunded: ${refundTransactionHash}`);

    // Auto-save to IPFS
    saveJobsToIPFS().catch(err => {
      console.error("Warning: IPFS save failed:", err.message);
    });

    res.json({
      success: true,
      jobId,
      freelancer: job.freelancer,
      message: "Fraud flag raised. Contract terminated and funds refunded to client.",
      fraudFlagTimestamp: job.fraudFlagTimestamp,
      refundTransactionHash,
      status: "terminated"
    });
  } catch (error) {
    console.error("Error raising fraud flag:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/freelancers/:address/fraud-flags
 * Get fraud flags for a freelancer
 */
app.get("/api/freelancers/:address/fraud-flags", (req, res) => {
  try {
    const { address } = req.params;

    // Get all jobs for this freelancer with fraud flags
    const allJobs = Array.from(jobStorage.values());
    const fraudFlaggedJobs = allJobs.filter(
      job => job.freelancer === address && job.fraudFlagRaised
    );

    res.json({
      success: true,
      freelancerAddress: address,
      fraudFlagCount: fraudFlaggedJobs.length,
      fraudFlags: fraudFlaggedJobs.map(job => ({
        jobId: job.id,
        timestamp: job.fraudFlagTimestamp,
        amount: job.amount,
        description: job.description,
        client: job.client,
      })),
      hasFraudFlags: fraudFlaggedJobs.length > 0,
    });
  } catch (error) {
    console.error("Error getting fraud flags:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/decrypt-file
 * Helper endpoint to decrypt a file (client-side usage)
 */
app.post("/api/decrypt-file", (req, res) => {
  try {
    const { encryptedData, key, iv } = req.body;

    if (!encryptedData || !key || !iv) {
      return res.status(400).json({ error: "Missing decryption parameters" });
    }

    const encryptedBuffer = Buffer.from(encryptedData, "hex");
    const keyBuffer = Buffer.from(key, "hex");
    const ivBuffer = Buffer.from(iv, "hex");

    const decrypted = encryptionManager.decryptFile(encryptedBuffer, keyBuffer, ivBuffer);

    res.json({
      decrypted: decrypted.toString("base64"),
      message: "File decrypted successfully",
    });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

/**
 * GET /api/ipfs/latest-cid
 * Get the latest IPFS CID for jobs database
 */
app.get("/api/ipfs/latest-cid", (req, res) => {
  res.json({
    success: true,
    cid: latestJobsIPFSCID,
    message: latestJobsIPFSCID
      ? "Latest CID available"
      : "No jobs saved to IPFS yet",
  });
});

// Server startup
const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log("🚀 FairDeal Backend starting...");

  // Load jobs from IPFS on startup (if CID is available)
  const RESTORE_FROM_CID = process.env.RESTORE_FROM_IPFS_CID;
  if (RESTORE_FROM_CID) {
    console.log(`📦 Attempting to restore from IPFS: ${RESTORE_FROM_CID}`);
    await loadJobsFromIPFS(RESTORE_FROM_CID);
  } else {
    console.log("ℹ️  No RESTORE_FROM_IPFS_CID set - starting with empty database");
    console.log("💡 Tip: Set RESTORE_FROM_IPFS_CID in .env to restore jobs from IPFS");
  }

  app.listen(PORT, () => {
    console.log(`✅ FairDeal Backend running on port ${PORT}`);
    console.log("Endpoints:");
    console.log("  POST   /api/jobs");
    console.log("  GET    /api/jobs");
    console.log("  GET    /api/jobs/:jobId");
    console.log("  POST   /api/jobs/:jobId/release-initial-payment");
    console.log("  POST   /api/jobs/:jobId/raise-fraud-flag");
    console.log("  POST   /api/jobs/submit-work");
    console.log("  GET    /api/jobs/:jobId/preview");
    console.log("  POST   /api/jobs/:jobId/approve");
    console.log("  POST   /api/jobs/:jobId/reject");
    console.log("  GET    /api/jobs/:jobId/status");
    console.log("  GET    /api/freelancers/:address/fraud-flags");
    console.log("  GET    /api/ipfs/latest-cid");

    if (latestJobsIPFSCID) {
      console.log(`\n💾 Latest IPFS CID: ${latestJobsIPFSCID}`);
      console.log(`🔗 View on IPFS: https://gateway.pinata.cloud/ipfs/${latestJobsIPFSCID}`);
    }
  });
}

startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
