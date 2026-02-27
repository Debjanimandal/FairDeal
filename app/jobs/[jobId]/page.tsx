'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@/components/WalletProvider';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import { approveWorkContract, requestRevisionContract, cancelDealContract } from '@/utils/contract-utils';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { wallet, userRole } = useWallet();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [approving, setApproving] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Add custom navbar styling for this page only
    const styleElement = document.createElement('style');
    styleElement.id = 'job-details-navbar-override';
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
    `;
    document.head.appendChild(styleElement);

    // Cleanup when leaving the page
    return () => {
      const style = document.getElementById('job-details-navbar-override');
      if (style) {
        style.remove();
      }
    };
  }, []);

  useEffect(() => {
    loadJobDetails();

    // Auto-refresh when window gains focus (user switches back to tab)
    const handleFocus = () => {
      console.log("🔄 Window focused - refreshing job details");
      loadJobDetails();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [jobId]);

  const loadJobDetails = async () => {
    if (!jobId) {
      setError("Job ID not found");
      setLoading(false);
      return;
    }

    try {
      // Fetch real job data from backend with cache busting
      const response = await axios.get(API_ENDPOINTS.JOB_DETAIL(jobId) + `?t=${Date.now()}`);

      if (response.data.success) {
        setJob(response.data.job);
        console.log("✅ Loaded job:", response.data.job);
        console.log("📊 Job State:", response.data.job.state, "| Type:", typeof response.data.job.state);
        console.log("👤 Current wallet:", wallet);
        console.log("🎭 User role:", userRole);
      } else {
        setError("Job not found");
        setJob(null);
      }

      // Load submission status from backend
      try {
        const statusResponse = await axios.get(API_ENDPOINTS.JOB_PREVIEW(jobId));
        setJobStatus(statusResponse.data);
      } catch (err) {
        // Not submitted yet
        setJobStatus(null);
      }
    } catch (err) {
      console.error("Error loading job:", err);
      setError("Failed to load job details");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const getStateLabel = (state: number) => {
    if (job?.fraudFlagRaised) return "Terminated (Fraud Flag)";
    if (job?.cancelledBy === 'client') return "Deal Cancelled";

    const labels: { [key: number]: string} = {
      0: "Created",
      1: "Submitted",
      2: "Approved",
      3: "Rejected",
      4: "Revision Requested",
    };
    return labels[state] || "Unknown";
  };

  const getStatusClass = (state: number) => {
    const states: { [key: number]: string } = {
      0: "status-created",
      1: "status-submitted",
      2: "status-approved",
      3: "status-rejected",
      4: "status-warning", // Use warning color for revision
    };
    return states[state] || "status-created";
  };

  const handleApprove = async () => {
    if (!jobId || !wallet) return;
    setApproving(true);
    try {
      // Call smart contract to release funds from escrow
      const contractJobId = job.contractJobId || parseInt(jobId);
      const txHash = await approveWorkContract(contractJobId, wallet);

      console.log("✅ Smart contract approved! TX:", txHash);

      // Update backend metadata and get decryption details
      const response = await axios.post(API_ENDPOINTS.JOB_APPROVE(jobId), {
        transactionHash: txHash
      });

      alert(`Job approved! Funds released from smart contract.\n\nOriginal file CID: ${response.data.originalCID}`);
      alert(`Decryption Key: ${response.data.decryptionKey}`);

      // Reload job status
      loadJobDetails();
    } catch (err: any) {
      setError("Failed to approve job: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!jobId || !wallet) return;
    if (window.confirm("Request revision from freelancer? Funds will remain in escrow.")) {
      setRejecting(true);
      try {
        // No smart contract call needed for revision request
        // Just update backend metadata - escrow remains locked

        console.log("📝 Requesting revision for job:", jobId);

        await axios.post(API_ENDPOINTS.JOB_REJECT(jobId), {
          type: 'request_changes'
        });

        console.log("✅ Revision requested! Backend updated.");

        alert("Revision requested successfully. Freelancer has been notified to resubmit.");

        // Reload job details to show updated state
        await loadJobDetails();
      } catch (err: any) {
        console.error("❌ Error requesting revision:", err);
        setError("Failed to request revision: " + err.message);
      } finally {
        setRejecting(false);
      }
    }
  };

  const handleCancelDeal = async () => {
    console.log("🔘 Cancel Deal button clicked!");
    console.log("jobId:", jobId, "wallet:", wallet, "job:", job);

    if (!jobId || !wallet) {
      console.error("❌ Missing jobId or wallet:", { jobId, wallet });
      alert("Error: Missing job ID or wallet connection");
      return;
    }

    if (window.confirm("⚠️ Are you sure you want to CANCEL this deal? The funds will be refunded to you.")) {
      setRejecting(true);
      try {
        console.log("🔄 Canceling deal for job:", jobId);
        console.log("📊 Full job object:", job);
        console.log("🔢 job.contractJobId:", job.contractJobId, "Type:", typeof job.contractJobId);

        // Validate contractJobId exists
        if (!job.contractJobId) {
          throw new Error(`Job is missing contractJobId field. This job may have been created with an old version. Job data: ${JSON.stringify(job)}`);
        }

        // Call smart contract to refund money to client (without fraud flag)
        const contractJobId = job.contractJobId;
        console.log("💰 Calling smart contract to cancel deal and refund... contractJobId:", contractJobId);

        const txHash = await cancelDealContract(contractJobId, wallet);

        console.log("✅ Smart contract refund successful! TX:", txHash);

        // Update backend
        console.log("📡 Updating backend...");
        await axios.post(API_ENDPOINTS.JOB_REJECT(jobId), {
          type: 'cancel_deal',
          clientAddress: wallet,
          transactionHash: txHash
        });

        console.log("✅ Deal cancelled! Funds refunded to client.");

        alert("Deal cancelled successfully. Funds have been refunded to your wallet.");

        // Reload job details
        await loadJobDetails();
      } catch (err: any) {
        console.error("❌ Error cancelling deal:", err);
        console.error("❌ Error details:", err.message, err.stack);

        // Check if job doesn't exist in the new smart contract
        if (err.message && (err.message.includes("Job not found") || err.message.includes("UnreachableCodeReached"))) {
          setError("This job was created with the old contract and doesn't exist anymore. Please create a NEW job.");
          alert("⚠️ SMART CONTRACT WAS UPDATED\n\nThis job was created with the old contract version and doesn't exist in the new contract.\n\n✅ Solution: Create a completely NEW job to test the cancel deal feature.");
        } else {
          setError("Failed to cancel deal: " + err.message);
          alert("Error cancelling deal: " + err.message);
        }
      } finally {
        setRejecting(false);
      }
    } else {
      console.log("❌ User cancelled the confirmation dialog");
    }
  };

  if (loading) return <div className="loading">Loading job details...</div>;
  if (!job) return <div className="error-message">Job not found</div>;

  const isClient = wallet === job.client || userRole === "client";
  const isFreelancer = wallet === job.freelancer || userRole === "freelancer";
  const effectiveState = job.fraudFlagRaised ? 3 : ((job.state === 0 && jobStatus) ? 1 : job.state);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0B1026 0%, #000000 100%)',
      paddingTop: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 198, 255, 0.1) 0%, transparent 70%)',
        filter: 'blur(100px)',
        zIndex: 0
      }}></div>

      {/* Main Content Area */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back Button & Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => router.push('/jobs')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#E2E8F0',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#F1F5F9',
              marginBottom: '0.15rem',
              letterSpacing: '-0.02em'
            }}>
              Job Details
            </h1>
            <p style={{ 
              fontSize: '0.8rem', 
              color: '#94A3B8',
              fontWeight: '500',
              margin: 0
            }}>
              #{jobId}
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '12px',
            color: '#991B1B',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Row - Escrow Amount and Status */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              {/* Escrow Amount Card */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#64748B',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Escrow Amount
                </p>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#0F172A'
                }}>
                  ${job.amount}
                </div>
              </div>

              {/* Status Card */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#64748B',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Status
                </p>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#0F172A'
                }}>
                  {getStateLabel(job.state)}
                </div>
              </div>
            </div>

            {/* Second Row - Deadline and Icon */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}>
              {/* Deadline Card */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#64748B',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Deadline
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#0F172A',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {new Date(job.deadline).toLocaleDateString()}
                </div>
              </div>

              {/* Description Card */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#64748B',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Description
                </p>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#0F172A',
                  lineHeight: '1.6'
                }}>
                  {job.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Work Submission Review */}
          <div>
            {isClient && jobStatus && effectiveState === 1 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h2 style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: '#0F172A',
                  margin: 0
                }}>
                  Work Submission Review
                </h2>
              </div>

              <p style={{
                fontSize: '0.8rem',
                color: '#64748B',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                Freelancer has submitted work, Review the preview below before approving payment.
              </p>

              {/* Blue Info Box */}
              <div style={{
                background: '#1E3A8A', // Dark blue
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                color: 'white'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.35rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Work Submitted - Ready for Review
                  </h3>
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  The Freelancer has submitted their work. You can now review the preview and decide to approve or request revisions.
                </p>
              </div>

              {/* Preview Button Box */}
              <div style={{
                background: '#F1F5F9', // Light gray/blue
                borderRadius: '8px',
                padding: '1.25rem 0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                {/* Background Pattern/Icon placeholder */}
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.1
                }}>
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1">
                     <circle cx="12" cy="12" r="10"></circle>
                     <path d="M1 12h22"></path>
                   </svg>
                </div>

                <a
                  href={jobStatus.previewURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.2rem',
                    background: '#1E293B', // Dark button
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Preview File
                </a>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: '#1E293B', // Dark Blue
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: approving ? 'not-allowed' : 'pointer',
                      opacity: approving ? 0.8 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {approving ? 'Processing...' : 'Approve & Pay'}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={rejecting}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: '#F59E0B', // Orange
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: rejecting ? 'not-allowed' : 'pointer',
                      opacity: rejecting ? 0.8 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4"></polyline>
                    </svg>
                    {rejecting ? 'Processing...' : 'Request Revision'}
                  </button>
                </div>

                <button
                  onClick={handleCancelDeal}
                  disabled={rejecting}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#64748B', // Grayish Blue
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: rejecting ? 'not-allowed' : 'pointer',
                    opacity: rejecting ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  Cancel Deal
                </button>
              </div>
            </div>
          )}

          {/* CLIENT: Waiting for Submission */}
          {isClient && effectiveState === 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#FEF3C7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: '0.5rem'
              }}>
                Waiting for Submission
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                lineHeight: '1.6'
              }}>
                The freelancer hasn&apos;t submitted work yet. You&apos;ll be notified when they upload.
              </p>
            </div>
          )}

          {/* FREELANCER: Submit Work */}
          {isFreelancer && (effectiveState === 0 || effectiveState === 4) && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#DBEAFE',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: '0.5rem'
              }}>
                {effectiveState === 4 ? 'Revision Requested' : 'Ready to Submit?'}
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                {effectiveState === 4 
                  ? 'The client requested changes. Upload a new version.'
                  : 'Upload your work to start the review process.'}
              </p>
              <button
                onClick={() => router.push(`/submit-work/${jobId}`)}
                style={{
                  padding: '0.875rem 2rem',
                  background: '#003366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#002244'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#003366'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {effectiveState === 4 ? 'Upload Revised Work' : 'Upload Work'}
              </button>
            </div>
          )}

          {/* FREELANCER: Work Submitted */}
          {isFreelancer && effectiveState === 1 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#D1FAE5',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: '0.5rem'
              }}>
                Work Submitted
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                lineHeight: '1.6'
              }}>
                Your work has been submitted. The client will review and release funds or request revisions.
              </p>
            </div>
          )}

          {/* Approved */}
          {effectiveState === 2 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#E0F2FE',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: '0.5rem'
              }}>
                Job Approved
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                Funds have been released! Transaction complete.
              </p>
              
              {isClient && job.fileDetails && (
                <a
                  href={jobId ? API_ENDPOINTS.JOB_DOWNLOAD(jobId) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.5rem',
                    background: '#003366',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#002244'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#003366'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download File ({job.fileDetails.fileName})
                </a>
              )}
            </div>
          )}

          {/* Deal Cancelled */}
          {effectiveState === 3 && job.cancelledBy === 'client' && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#FEE2E2',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: '0.5rem'
              }}>
                Deal Cancelled
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                lineHeight: '1.6'
              }}>
                {isClient
                  ? 'You cancelled this deal. Funds have been refunded.'
                  : 'The client cancelled this deal.'}
              </p>
            </div>
          )}
          {/* Fraud Flag Warning */}
          {job.fraudFlagRaised && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '16px',
              padding: '2rem',
              marginTop: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <strong style={{ color: '#991B1B', fontSize: '1rem' }}>Fraud Flag Raised</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#7F1D1D' }}>
                Flagged on: {new Date(job.fraudFlagTimestamp).toLocaleString()}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
