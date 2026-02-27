'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@/components/WalletProvider';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';

export default function SubmitWorkPage() {
  const params = useParams();
  const router = useRouter();
  const { wallet } = useWallet();
  const jobId = params.jobId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);

  // Add custom navbar styling for this page only
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.id = 'submit-work-navbar-override';
    styleElement.innerHTML = `
      .navbar {
        background: rgba(11, 16, 38, 0.4) !important;
        backdrop-filter: blur(24px) !important;
        -webkit-backdrop-filter: blur(24px) !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
      }
      .navbar .logo-container span {
        color: transparent !important;
        background: linear-gradient(to right, #00C6FF, #0072FF) !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
      }
      .navbar .nav-links a {
        color: rgba(255, 255, 255, 0.9) !important;
        background: transparent !important;
      }
      .navbar .nav-links a:hover {
        color: #FFFFFF !important;
      }
      .navbar .nav-links button {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #FFFFFF !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      .navbar .nav-links button:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      const style = document.getElementById('submit-work-navbar-override');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Load job data to get contract job ID
  React.useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.JOB_DETAIL(jobId));
        if (response.data.success) {
          setJobData(response.data.job);
        }
      } catch (err) {
        console.error('Failed to load job data:', err);
      }
    };
    loadJob();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

      if (totalSize > 50 * 1024 * 1024) {
        setError("Total size must be less than 50MB");
        return;
      }

      setFiles(selectedFiles);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("active");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("active");
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("active");

    if (e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(droppedFiles);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select files or a folder");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("jobId", jobId || "");
      formData.append("freelancerAddress", wallet || "");

      // Append all files
      files.forEach(file => {
        formData.append("files[]", file);
      });

      const response = await axios.post(API_ENDPOINTS.SUBMIT_WORK, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Files uploaded to IPFS and backend updated.");

      // State managed in backend only - no wallet confirmation needed
      // Smart contract will only be called for fund-related operations (approve/cancel)
      console.log("✅ Work submitted successfully. State updated in backend without blockchain transaction.");

      setSuccess("");
      setSubmissionData(response.data);
      setFiles([]);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to submit work"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      paddingTop: "0.5rem", 
      paddingBottom: "2rem", 
      paddingLeft: "1rem", 
      paddingRight: "1rem", 
      minHeight: "100vh",
      background: '#000000',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      {/* Ambient Background Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 114, 255, 0.06) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div style={{ width: "100%", maxWidth: "500px", position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => router.push(`/jobs/${jobId}`)}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: "0.3rem 0.6rem",
              fontSize: "0.8rem",
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '500',
              marginBottom: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Job
          </button>

          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: "700",
            marginBottom: "0.25rem",
            color: '#FFFFFF'
          }}>Submit Work</h1>
        </div>

        {/* Main Card */}
        <div style={{ 
          background: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#EF4444',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>{error}</div>
        )}

        {!submissionData ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#000000'
              }}>
                Select Code Folder or Files to Upload *
              </label>

              {/* File input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                multiple
                {...({ webkitdirectory: "", directory: "" } as any)}
                style={{
                  width: '100%',
                  padding: "0.5rem",
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  color: '#000000',
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: 'all 0.3s ease'
                }}
              />

              {files.length > 0 && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "#F1F5F9",
                    borderRadius: "8px",
                    marginTop: "0.75rem",
                    border: "1px solid #E2E8F0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", paddingBottom: '0.25rem', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: "#475569", fontWeight: '500', fontSize: '0.85rem' }}>Files Selected:</span>
                    <strong style={{ color: '#000000', fontSize: '0.85rem' }}>{files.length} file(s)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#475569", fontWeight: '500', fontSize: '0.85rem' }}>Total Size:</span>
                    <span style={{ color: '#000000', fontSize: '0.85rem' }}>{(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div style={{ marginTop: "0.5rem", maxHeight: "80px", overflowY: "auto", paddingTop: '0.25rem', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ color: "#475569", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: '600' }}>Files:</div>
                    {files.map((f, idx) => (
                      <div key={idx} style={{ fontSize: "0.8rem", padding: "0.15rem 0", color: '#000000' }}>• {f.name}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '0.75rem',
                padding: "0.5rem 0.75rem",
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#000000' }}>
                  <div style={{ 
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginBottom: '0.15rem',
                    color: '#0284C7'
                  }}>Security & Privacy Process:</div>
                  <ol style={{ marginLeft: "1.25rem", lineHeight: "1.3", color: '#334155', fontSize: '0.75rem', margin: 0 }}>
                    <li>Code folder will be compressed into ZIP and encrypted with AES-256</li>
                    <li>A code execution preview will be generated for client review</li>
                    <li>Both encrypted ZIP and preview are pinned to IPFS</li>
                    <li>Client sees only execution preview until they approve payment</li>
                    <li>Source code is revealed only after approval</li>
                  </ol>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "center" }}>
              <button
                type="submit"
                disabled={files.length === 0 || loading}
                style={{ 
                  width: "200px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.9rem",
                  fontWeight: '600',
                  background: files.length === 0 || loading ? '#E2E8F0' : '#003366',
                  color: files.length === 0 || loading ? '#94A3B8' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: files.length === 0 || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: files.length === 0 || loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (files.length > 0 && !loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 51, 102, 0.3)';
                    e.currentTarget.style.background = '#004080';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  if (files.length > 0 && !loading) {
                    e.currentTarget.style.background = '#003366';
                  }
                }}
              >
                {loading ? "Uploading..." : `Submit Work`}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/jobs/${jobId}`)}
                style={{ 
                  width: "200px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.9rem",
                  fontWeight: '600',
                  background: '#F8FAFC',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ 
              color: "#0072FF", 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '1rem' 
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0, 114, 255, 0.1)',
                border: '2px solid rgba(0, 114, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <h3 style={{ 
              fontSize: "1.5rem", 
              color: "#000000", 
              marginBottom: "0.5rem",
              fontWeight: '700'
            }}>Work Submitted Successfully!</h3>
            <p style={{
              color: '#475569',
              fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}>The client will be notified to review your submission.</p>

            <div style={{ 
              background: "#F8FAFC", 
              padding: "1.5rem", 
              borderRadius: "12px", 
              border: "1px solid #E2E8F0", 
              textAlign: "left", 
              marginBottom: "1.5rem" 
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#000000'
              }}>Submission Details</div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ 
                  fontSize: '0.85rem',
                  color: "#475569",
                  marginBottom: '0.25rem',
                  fontWeight: '500'
                }}>Job ID</div>
                <div style={{
                  fontFamily: "monospace",
                  color: '#000000',
                  fontSize: '0.9rem'
                }}>{submissionData.jobId}</div>
              </div>

              {submissionData.previewCID && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ 
                    fontSize: '0.85rem',
                    color: "#475569",
                    marginBottom: '0.25rem',
                    fontWeight: '500'
                  }}>Preview CID</div>
                  <div style={{
                    fontFamily: "monospace",
                    color: '#0284C7',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all'
                  }}>{submissionData.previewCID}</div>
                </div>
              )}

              <div style={{
                marginTop: "1rem",
                padding: "1rem",
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: '0.85rem',
                  color: "#0284C7",
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>Preview URL</div>
                <div style={{ marginBottom: "0.5rem", wordBreak: "break-all" }}>
                  <a 
                    href={submissionData.previewURL || `https://w3s.link/ipfs/${submissionData.previewCID}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: '#0284C7',
                      textDecoration: 'none',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem'
                    }}
                  >
                    {submissionData.previewURL || `https://w3s.link/ipfs/${submissionData.previewCID}`}
                  </a>
                </div>
                <p style={{ 
                  fontSize: "0.8rem",
                  color: '#475569',
                  margin: '0'
                }}>
                  Share this link with the client if needed. They can review it directly from their dashboard.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                router.push(`/jobs/${jobId}`);
                setTimeout(() => window.location.reload(), 100);
              }}
              style={{ 
                width: "200px",
                padding: "0.75rem 1.5rem",
                fontSize: '0.9rem',
                fontWeight: '600',
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 51, 102, 0.3)';
                e.currentTarget.style.background = '#004080';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = '#003366';
              }}
            >
              Back to Job Details
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
