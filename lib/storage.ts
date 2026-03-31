import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const FRAUD_FILE = path.join(DATA_DIR, 'fraud.json');
const IPFS_FILE = path.join(DATA_DIR, 'ipfs-cid.json');

// Ensure data directory exists (only in local env)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Ignore in serverless environment
}

// Load data from files
function loadFromFile(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    // File doesn't exist or can't be read
  }
  return {};
}

function saveToFile(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Can't write in serverless - that's expected
  }
}

// Initialize storage from files
const jobsData = loadFromFile(JOBS_FILE);
const filesData = loadFromFile(FILES_FILE);
const fraudData = loadFromFile(FRAUD_FILE);
const ipfsData = loadFromFile(IPFS_FILE);

export const jobStorage = new Map<string, any>(Object.entries(jobsData));
export const jobFiles = new Map<string, any>(Object.entries(filesData));
export const fraudFlags = new Map<string, any[]>(Object.entries(fraudData));

export let latestJobsIPFSCID: string | null = ipfsData.cid || null;

// Persist functions
export function persistJobs() {
  saveToFile(JOBS_FILE, Object.fromEntries(jobStorage));
}

export function persistFiles() {
  saveToFile(FILES_FILE, Object.fromEntries(jobFiles));
}

export function persistFraud() {
  saveToFile(FRAUD_FILE, Object.fromEntries(fraudFlags));
}

export function setLatestJobsIPFSCID(cid: string) {
  latestJobsIPFSCID = cid;
  saveToFile(IPFS_FILE, { cid });
}

export function clearStorage() {
  jobStorage.clear();
  jobFiles.clear();
  fraudFlags.clear();
  persistJobs();
  persistFiles();
  persistFraud();
}

// Compatibility functions for Vercel storage interface
export async function ensureInitialized() {
  // No-op for local storage (already initialized)
  return Promise.resolve();
}

export async function saveToIPFS() {
  // Import here to avoid circular dependency
  const { saveJobsToIPFS } = await import('./ipfs-utils');
  return saveJobsToIPFS(jobStorage);
}

export async function loadJobsFromIPFS(cid?: string) {
  // Import here to avoid circular dependency
  const { loadJobsFromIPFS: loadFn } = await import('./ipfs-utils');
  if (cid) {
    return loadFn(cid, jobStorage);
  }
}
