import { NextRequest, NextResponse } from 'next/server';
import { jobStorage, jobFiles } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const job = jobStorage.get(jobId);
    const jobData = jobFiles.get(jobId);

    if (!job || !jobData || !jobData.originalBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (job.state !== 2) {
      return NextResponse.json({ error: "Access denied. Job not approved." }, { status: 403 });
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${jobData.fileName}"`);
    headers.set('Content-Type', 'application/octet-stream');

    return new NextResponse(jobData.originalBuffer, { headers });
  } catch (error: any) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
