// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  JOBS: `${API_BASE_URL}/api/jobs`,
  JOB_DETAIL: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}`,
  JOB_PREVIEW: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/preview`,
  JOB_APPROVE: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/approve`,
  JOB_REJECT: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/reject`,
  JOB_FRAUD_FLAG: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/raise-fraud-flag`,
  JOB_DOWNLOAD: (jobId: string) => `${API_BASE_URL}/api/jobs/${jobId}/download`,
  SUBMIT_WORK: `${API_BASE_URL}/api/jobs/submit-work`,
  ESCROW_ADDRESS: `${API_BASE_URL}/api/escrow-address`,
};

export default { API_BASE_URL, API_ENDPOINTS };
