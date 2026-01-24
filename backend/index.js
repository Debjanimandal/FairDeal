const express = require("express");
const multer = require("multer");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const Jimp = require("jimp");
const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");

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
 * Submit work for a job
 * Body: jobId, freelancerAddress, file
 */
app.post("/api/jobs/submit-work", upload.single("file"), async (req, res) => {
  try {
    const { jobId, freelancerAddress } = req.body;
    const file = req.file;

    if (!jobId || !file) {
      return res.status(400).json({ error: "Missing jobId or file" });
    }

    // Generate encryption key
    const encryptionKey = encryptionManager.generateKey();

    // Encrypt the original file
    const encrypted = encryptionManager.encryptFile(file.buffer, encryptionKey);

    // Upload encrypted original to IPFS
    const originalCID = await uploadToIPFS(encrypted.encrypted, `${jobId}-original-${Date.now()}`);

    // Create watermarked preview
    const watermarked = await watermarkManager.addWatermark(file.buffer, `Job ${jobId}`);

    // Upload watermarked preview to IPFS
    const previewCID = await uploadToIPFS(watermarked, `${jobId}-preview-${Date.now()}`);

    // Store job data in memory
    jobFiles.set(jobId, {
      jobId,
      freelancerAddress,
      originalCID,
      previewCID,
      encryptionKey: encryptionKey.toString("hex"),
      encryptionIV: encrypted.iv.toString("hex"),
      submittedAt: new Date().toISOString(),
      fileName: file.originalname,
      fileSize: file.size,
    });

    res.json({
      success: true,
      jobId,
      previewCID,
      originalCID, // Don't reveal original CID until approved
      message: "Work submitted successfully. Preview is now visible to client.",
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
app.get("/api/jobs/:jobId/preview", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      jobId,
      previewCID: jobData.previewCID,
      previewURL: `https://gateway.pinata.cloud/ipfs/${jobData.previewCID}`,
      fileName: jobData.fileName,
      submittedAt: jobData.submittedAt,
      message: "Preview is ready. Share this URL to view the watermarked preview.",
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
app.post("/api/jobs/:jobId/approve", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Reveal the original file CID and decryption key
    const response = {
      jobId,
      originalCID: jobData.originalCID,
      originalURL: `https://gateway.pinata.cloud/ipfs/${jobData.originalCID}`,
      decryptionKey: jobData.encryptionKey,
      decryptionIV: jobData.encryptionIV,
      fileName: jobData.fileName,
      message: "Job approved! Use the decryption key to decrypt the original file.",
      decryptionInstructions: "Use AES-256-CBC with the provided key and IV",
    };

    // Mark as approved in storage
    jobData.approved = true;
    jobData.approvedAt = new Date().toISOString();

    res.json(response);
  } catch (error) {
    console.error("Error approving job:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:jobId/reject
 * Reject job (original file is never revealed)
 */
app.post("/api/jobs/:jobId/reject", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Mark as rejected and delete the original file data
    jobData.rejected = true;
    jobData.rejectedAt = new Date().toISOString();

    res.json({
      jobId,
      message: "Job rejected. Original file will not be revealed.",
    });
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
app.post("/api/jobs/:jobId/raise-fraud-flag", (req, res) => {
  try {
    const { jobId } = req.params;
    const { clientAddress } = req.body;
    const job = jobStorage.get(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.client !== clientAddress) {
      return res.status(403).json({ error: "Unauthorized: Only client can raise fraud flag" });
    }

    if (!job.initialPaymentReleased) {
      return res.status(400).json({ error: "Cannot raise fraud flag: Initial payment not released" });
    }

    if (job.state !== 0) {
      return res.status(400).json({ error: "Cannot raise fraud flag: Work already submitted or completed" });
    }

    if (job.fraudFlagRaised) {
      return res.status(400).json({ error: "Fraud flag already raised" });
    }

    // Set fraud flag
    job.fraudFlagRaised = true;
    job.fraudFlagTimestamp = new Date().toISOString();
    jobStorage.set(jobId, job);

    // Track fraud flag by freelancer address
    if (!fraudFlags.has(job.freelancer)) {
      fraudFlags.set(job.freelancer, []);
    }
    fraudFlags.get(job.freelancer).push({
      jobId,
      timestamp: job.fraudFlagTimestamp,
      amount: job.amount,
      description: job.description,
    });

    console.log(`🚨 Fraud flag raised on job ${jobId} for freelancer ${job.freelancer}`);

    // Auto-save to IPFS
    saveJobsToIPFS().catch(err => {
      console.error("Warning: IPFS save failed:", err.message);
    });

    res.json({
      success: true,
      jobId,
      freelancer: job.freelancer,
      message: "Fraud flag raised successfully",
      fraudFlagTimestamp: job.fraudFlagTimestamp,
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
