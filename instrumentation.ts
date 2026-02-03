import axios from 'axios';
import { jobStorage, setLatestJobsIPFSCID } from './lib/storage';

/**
 * Load jobs from IPFS on startup
 */
async function loadJobsFromIPFS(cid: string) {
  try {
    if (!cid) {
      console.log('ℹ️ No CID provided, starting with empty database');
      return;
    }

    console.log(`📥 Loading jobs from IPFS: ${cid}`);

    // Fetch from IPFS gateway
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const jobsData = response.data;

    // Restore jobs to Map
    jobsData.jobs.forEach((job: any) => {
      jobStorage.set(job.id, job);
    });

    setLatestJobsIPFSCID(cid);

    console.log(`✅ Loaded ${jobsData.jobs.length} jobs from IPFS`);
    console.log(`📅 Last updated: ${jobsData.lastUpdated}`);

    return jobsData.jobs.length;
  } catch (error: any) {
    console.error('❌ Error loading jobs from IPFS:', error.message);
    return 0;
  }
}

/**
 * Server startup initialization
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 FairDeal Next.js Backend starting...');

    // Load jobs from IPFS on startup (if CID is available)
    const RESTORE_FROM_CID = process.env.RESTORE_FROM_IPFS_CID;
    if (RESTORE_FROM_CID) {
      console.log(`📦 Attempting to restore from IPFS: ${RESTORE_FROM_CID}`);
      await loadJobsFromIPFS(RESTORE_FROM_CID);
    } else {
      console.log('ℹ️  No RESTORE_FROM_IPFS_CID set - starting with file-based storage');
      console.log('💡 Tip: Set RESTORE_FROM_IPFS_CID in .env to restore jobs from IPFS');
    }

    console.log('✅ FairDeal Backend initialized');
    console.log('API Endpoints:');
    console.log('  POST   /api/jobs');
    console.log('  GET    /api/jobs');
    console.log('  GET    /api/jobs/:jobId');
    console.log('  POST   /api/jobs/:jobId/release-initial-payment');
    console.log('  POST   /api/jobs/:jobId/raise-fraud-flag');
    console.log('  POST   /api/jobs/submit-work');
    console.log('  GET    /api/jobs/:jobId/preview');
    console.log('  GET    /api/jobs/:jobId/preview-content');
    console.log('  GET    /api/jobs/:jobId/download');
    console.log('  POST   /api/jobs/:jobId/approve');
    console.log('  POST   /api/jobs/:jobId/reject');
    console.log('  GET    /api/jobs/:jobId/status');
    console.log('  GET    /api/freelancers/:address/fraud-flags');
    console.log('  POST   /api/decrypt-file');
    console.log('  GET    /api/ipfs/latest-cid');
    console.log('  GET    /api/health');
    console.log('  GET    /api/escrow-address');
  }
}
