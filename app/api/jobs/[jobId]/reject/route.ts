import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles, persistJobs, persistFiles } from '@/lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await req.json();
    const { type, transactionHash } = body;

    const job = jobStorage.get(jobId);
    const jobData = jobFiles.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.state !== 1) {
      return NextResponse.json({ error: "Job must be in submitted state" }, { status: 400 });
    }

    // Default to 'request_changes' if not specified (safer default)
    const rejectType = type || 'request_changes';

    if (rejectType === 'cancel_deal') {
      // CANCEL DEAL -> REFUND CLIENT & TERMINATE JOB
      console.log(`🔄 Processing deal cancellation for job ${jobId}...`);
      console.log(`💸 Refund transaction hash: ${transactionHash}`);

      // Terminate the job permanently
      job.state = 3; // Rejected/Cancelled
      job.cancelledAt = new Date().toISOString();
      job.cancelledBy = 'client';
      job.cancelReason = 'Client cancelled the deal';
      job.refundTransactionHash = transactionHash;
      jobStorage.set(jobId, job);

      persistJobs();
      persistFiles();

      console.log(`✅ Job ${jobId} cancelled and terminated. Funds refunded to client.`);
      console.log(`📊 Updated job:`, job);

      return NextResponse.json({
        success: true,
        message: "Deal cancelled. Funds refunded to client.",
        jobId,
        status: "cancelled",
        newState: job.state,
        refundTransactionHash: transactionHash,
      });
    } else if (rejectType === 'final_reject') {
      // 1. FINAL REJECTION -> REFUND CLIENT (Handled by Smart Contract)
      // The frontend already called the contract and passed the TX hash
      const transactionHash = body.transactionHash;

      // Update job state
      job.state = 3; // Rejected (Final)
      job.refundTransactionHash = transactionHash;
      job.rejectedAt = new Date().toISOString();
      jobStorage.set(jobId, job);

      // Mark file data as rejected if exists
      if (jobData) {
        jobData.rejected = true;
        jobData.rejectedAt = new Date().toISOString();
        jobFiles.set(jobId, jobData);
      }

      persistJobs();
      persistFiles();

      console.log(`❌ Job ${jobId} rejected (FINAL)! Funds refunded by Smart Contract. TX: ${transactionHash}`);

      return NextResponse.json({
        success: true,
        message: "Job rejected and funds refunded to client",
        jobId,
        refundTransactionHash: transactionHash,
        status: "rejected",
      });
    } else {
      // 2. REQUEST CHANGES -> ALLOW RESUBMISSION (NO REFUND)
      console.log(`↩️ Processing revision request for job ${jobId}...`);
      
      job.state = 4; // Revision Requested
      job.revisionRequestedAt = new Date().toISOString();
      jobStorage.set(jobId, job);
      persistJobs();

      console.log(`✅ Job ${jobId} state updated to 4 (Revision Requested). Funds remain in escrow.`);
      console.log(`📊 Updated job:`, job);

      return NextResponse.json({
        success: true,
        message: "Revision requested. Freelancer can resubmit.",
        jobId,
        status: "revision_requested",
        newState: job.state,
      });
    }
  } catch (error: any) {
    console.error("Error rejecting job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
