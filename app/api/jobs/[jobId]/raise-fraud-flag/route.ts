import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, setLatestJobsIPFSCID, persistJobs } from '@/lib/storage';
import { saveJobsToIPFS } from '@/lib/ipfs-utils';

// Fraud report storage
const fraudReportStorage = new Map<string, any>();

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

    // Verify client is the one raising flag
    if (job.client !== clientAddress) {
      return NextResponse.json(
        { error: "Only the client can raise a fraud flag" },
        { status: 403 }
      );
    }

    if (job.fraudFlagRaised) {
      return NextResponse.json({ error: "Fraud flag already raised" }, { status: 400 });
    }

    // New logic: Auto-refund and terminate contract
    console.log(`🚨 Fraud flag raised on job ${jobId}. Syncing with Smart Contract state.`);

    const transactionHash = body.transactionHash; // Passed from frontend

    // 2. Update job state
    job.fraudFlagRaised = true;
    job.fraudFlagTimestamp = new Date().toISOString();
    job.state = 3; // Rejected / Terminated
    job.refundTransactionHash = transactionHash;
    job.rejectedAt = new Date().toISOString();

    jobStorage.set(jobId, job);
    persistJobs();

    // Save fraud record
    fraudReportStorage.set(`${jobId}-${clientAddress}`, {
      jobId,
      client: clientAddress,
      freelancer: job.freelancer,
      timestamp: new Date().toISOString(),
      amount: job.amount,
      description: job.description,
    });

    console.log(`🚨 Job ${jobId} terminated due to fraud flag. Funds refunded: ${transactionHash}`);

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
      freelancer: job.freelancer,
      message: "Fraud flag raised. Contract terminated and funds refunded to client.",
      fraudFlagTimestamp: job.fraudFlagTimestamp,
      refundTransactionHash: transactionHash,
      status: "terminated",
    });
  } catch (error: any) {
    console.error("Error raising fraud flag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
