import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    // Get all jobs for this freelancer with fraud flags
    const allJobs = Array.from(jobStorage.values());
    const fraudFlaggedJobs = allJobs.filter(
      (job: any) => job.freelancer === address && job.fraudFlagRaised
    );

    return NextResponse.json({
      success: true,
      freelancerAddress: address,
      fraudFlagCount: fraudFlaggedJobs.length,
      fraudFlags: fraudFlaggedJobs.map((job: any) => ({
        jobId: job.id,
        timestamp: job.fraudFlagTimestamp,
        amount: job.amount,
        description: job.description,
        client: job.client,
      })),
      hasFraudFlags: fraudFlaggedJobs.length > 0,
    });
  } catch (error: any) {
    console.error("Error getting fraud flags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
