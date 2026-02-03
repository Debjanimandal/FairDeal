import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles, setLatestJobsIPFSCID, persistJobs } from '@/lib/storage';
import { saveJobsToIPFS } from '@/lib/ipfs-utils';

// GET /api/jobs - List all jobs
export async function GET() {
  try {
    const jobs = Array.from(jobStorage.values());
    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error: any) {
    console.error("Error listing jobs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/jobs - Create a new job
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client,
      freelancer,
      amount,
      deadline,
      description,
      transactionHash,
      contractJobId,
    } = body;

    if (!client || !freelancer || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      transactionHash: transactionHash || null,
      paymentConfirmed: !!transactionHash,
      fraudFlagRaised: false,
      fraudFlagTimestamp: null,
      contractJobId: contractJobId, // Save the smart contract Job ID
    };

    // Store in memory
    jobStorage.set(jobId, job);
    persistJobs(); // Save to disk immediately

    console.log(`Job created: ${jobId} by ${client}`);
    if (transactionHash) {
      console.log(`💰 Payment transaction: ${transactionHash}`);
    }

    // Auto-save to IPFS for persistence
    saveJobsToIPFS(jobStorage)
      .then((cid) => {
        if (cid) {
          setLatestJobsIPFSCID(cid);
          console.log(`💾 Database persisted to IPFS`);
        }
      })
      .catch((err) => {
        console.error("Warning: IPFS save failed:", err.message);
      });

    return NextResponse.json({
      success: true,
      job,
      message: transactionHash
        ? "Job created successfully with payment confirmation"
        : "Job created successfully",
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
