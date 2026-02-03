import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const job = jobStorage.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If approved, attach simplified file details for download
    if (job.state === 2) {
      const jobData = jobFiles.get(jobId);
      if (jobData) {
        (job as any).fileDetails = {
          fileName: jobData.fileName,
          originalCID: jobData.originalCID,
          encryptionKey: jobData.encryptionKey,
          encryptionIV: jobData.encryptionIV,
          isCodeFolder: jobData.isCodeFolder,
        };
      }
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error("Error getting job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
