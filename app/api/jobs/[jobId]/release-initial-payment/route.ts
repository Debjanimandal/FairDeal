import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, setLatestJobsIPFSCID, persistJobs } from '@/lib/storage';
import { saveJobsToIPFS } from '@/lib/ipfs-utils';

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await req.json();
    const { clientAddress } = body;
    
    const job = jobStorage.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.client !== clientAddress) {
      return NextResponse.json(
        { error: "Unauthorized: Only client can release payment" },
        { status: 403 }
      );
    }

    if (job.initialPaymentReleased) {
      return NextResponse.json({ error: "Initial payment already released" }, { status: 400 });
    }

    // Mark initial payment as released
    job.initialPaymentReleased = true;
    job.initialPaymentReleasedAt = new Date().toISOString();
    jobStorage.set(jobId, job);
    persistJobs();

    // Calculate initial payment amount
    const initialAmount = (job.amount * job.initialPaymentPercent) / 100;

    console.log(`💰 Initial payment released for job ${jobId}: ${initialAmount} (${job.initialPaymentPercent}%)`);

    // Auto-save to IPFS
    saveJobsToIPFS(jobStorage)
      .then((cid) => {
        if (cid) setLatestJobsIPFSCID(cid);
      })
      .catch((err) => {
        console.error("Warning: IPFS save failed:", err.message);
      });

    return NextResponse.json({
      success: true,
      jobId,
      initialAmount,
      percentage: job.initialPaymentPercent,
      remainingAmount: job.amount - initialAmount,
      message: `Initial payment of ${initialAmount} released to freelancer`,
    });
  } catch (error: any) {
    console.error("Error releasing initial payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
