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
      return new NextResponse("Job data not found", { status: 404 });
    }

    if (jobData.previewText) {
      const headers = new Headers();
      if (jobData.previewText.trim().startsWith("<!DOCTYPE") || jobData.previewText.trim().startsWith("<html")) {
        headers.set('Content-Type', 'text/html; charset=utf-8');
      } else {
        headers.set('Content-Type', 'text/plain; charset=utf-8');
      }
      return new NextResponse(jobData.previewText, { headers });
    } else {
      return new NextResponse("No text preview available", { status: 404 });
    }
  } catch (error: any) {
    console.error("Error serving preview content:", error);
    return new NextResponse("Error serving preview", { status: 500 });
  }
}
