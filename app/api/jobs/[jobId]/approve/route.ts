import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles, persistJobs } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await req.json();
    const transactionHash = body.transactionHash; // Smart contract transaction hash from frontend
    
    const job = jobStorage.get(jobId);
    const jobData = jobFiles.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.state !== 1) {
      return NextResponse.json({ error: "Job must be in submitted state" }, { status: 400 });
    }

    // Smart contract already released funds - just update metadata
    console.log(`📝 Smart contract approved job ${jobId}, updating metadata...`);

    // Update job state
    job.state = 2; // Approved
    job.releaseTransactionHash = transactionHash; // Store contract transaction hash
    job.approvedAt = new Date().toISOString();
    jobStorage.set(jobId, job);

    // Also mark file data as approved if exists
    if (jobData) {
      jobData.approved = true;
      jobData.approvedAt = new Date().toISOString();
      jobFiles.set(jobId, jobData);
    }

    persistJobs();
    console.log(`✅ Job ${jobId} metadata updated! Smart contract released funds.`);

    return NextResponse.json({
      success: true,
      message: "Job approved via smart contract and funds released to freelancer",
      jobId,
      releaseTransactionHash: transactionHash,
      originalCID: jobData?.originalCID,
      originalURL: jobData ? `https://gateway.pinata.cloud/ipfs/${jobData.originalCID}` : null,
      decryptionKey: jobData?.encryptionKey,
      decryptionIV: jobData?.encryptionIV,
    });
  } catch (error: any) {
    console.error("Error approving job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
