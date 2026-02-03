import { NextResponse } from 'next/server';
import { latestJobsIPFSCID } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({
    cid: latestJobsIPFSCID,
    timestamp: new Date().toISOString(),
  });
}
