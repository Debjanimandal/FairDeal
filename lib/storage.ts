import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const FRAUD_FILE = path.join(DATA_DIR, 'fraud.json');
const IPFS_FILE = path.join(DATA_DIR, 'ipfs-cid.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files
function loadFromFile(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
  return {};
}

function saveToFile(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
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
