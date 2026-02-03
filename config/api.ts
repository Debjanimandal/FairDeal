// API Configuration for Next.js
const API_BASE_URL = typeof window === 'undefined' ? 'http://localhost:3000' : '';

export const API_ENDPOINTS = {
  JOBS: `${API_BASE_URL}/api/jobs`,
  JOB_DETAIL: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}`,
  JOB_PREVIEW: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/preview`,
  JOB_PREVIEW_CONTENT: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/preview-content`,
  JOB_APPROVE: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/approve`,
  JOB_REJECT: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/reject`,
  JOB_FRAUD_FLAG: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/raise-fraud-flag`,
  JOB_DOWNLOAD: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/download`,
  JOB_STATUS: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/status`,
  RELEASE_INITIAL_PAYMENT: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/release-initial-payment`,
  SUBMIT_WORK: `${API_BASE_URL}/api/jobs/submit-work`,
  ESCROW_ADDRESS: `${API_BASE_URL}/api/escrow-address`,
  FREELANCER_FRAUD_FLAGS: (address: string) => `${API_BASE_URL}/api/freelancers/${address}/fraud-flags`,
};

export default { API_BASE_URL, API_ENDPOINTS };
