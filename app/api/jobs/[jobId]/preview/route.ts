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
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const baseURL = req.nextUrl.origin;
    
    // Always return JSON metadata
    return NextResponse.json({
      jobId,
      previewURL: jobData.previewText && !jobData.previewText.startsWith("Preview available")
        ? `${baseURL}/api/jobs/${jobId}/preview-content`
        : `https://gateway.pinata.cloud/ipfs/${jobData.previewCID}`,
    });
  } catch (error: any) {
    console.error("Error getting preview:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
