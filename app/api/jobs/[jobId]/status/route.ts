import { NextRequest, NextResponse } from 'next/server';
import { jobFiles } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const jobData = jobFiles.get(jobId);

    if (!jobData) {
      return NextResponse.json({ status: "not_submitted" }, { status: 404 });
    }

    const status = {
      jobId,
      submitted: true,
      submittedAt: jobData.submittedAt,
      fileName: jobData.fileName,
      approved: jobData.approved || false,
      rejected: jobData.rejected || false,
    };

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Error getting status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
