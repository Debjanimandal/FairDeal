import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface JobDetailProps {
  wallet: string | null;
  userRole: string | null;
}

const JobDetail: React.FC<JobDetailProps> = ({ wallet, userRole }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [approving, setApproving] = useState<boolean>(false);
  const [rejecting, setRejecting] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      // Fetch real job data from backend
      const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}`);

      if (response.data.success) {
        setJob(response.data.job);
        console.log("Loaded job:", response.data.job);
        console.log("Job State:", response.data.job.state, typeof response.data.job.state);
      } else {
        setError("Job not found");
        setJob(null);
      }

      // Load submission status from backend
      try {
        const statusResponse = await axios.get(`http://localhost:5000/api/jobs/${jobId}/preview`);
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

    const labels: { [key: number]: string } = {
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
    setApproving(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/jobs/${jobId}/approve`);

      alert(`Job approved! Original file CID: ${response.data.originalCID}`);
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
    if (window.confirm("Request revision from freelancer? Funds will remain in escrow.")) {
      setRejecting(true);
      try {
        // Default reject (type: request_changes)
        await axios.post(`http://localhost:5000/api/jobs/${jobId}/reject`, { type: 'request_changes' });
        alert("Revision requested. Freelancer has been notified to resubmit.");
        loadJobDetails();
      } catch (err: any) {
        setError("Failed to request revision: " + err.message);
      } finally {
        setRejecting(false);
      }
    }
  };

  const handleRaiseFraudFlag = async () => {
    if (window.confirm("🚨 Are you sure you want to RAISE A FRAUD FLAG? This will strictly terminate the contract and refund 90% of funds to you immediately.")) {
      setRejecting(true);
      try {
        await axios.post(`http://localhost:5000/api/jobs/${jobId}/raise-fraud-flag`, { clientAddress: wallet });
        alert("Fraud flag raised. Contract terminated and funds refunded.");
        loadJobDetails();
      } catch (err: any) {
        setError("Failed to raise fraud flag: " + err.message);
      } finally {
        setRejecting(false);
      }
    }
  };



  if (loading) return <div className="loading">Loading job details...</div>;
  if (!job) return <div className="error-message">Job not found</div>;

  const isClient = wallet === job.client || userRole === "client";
  const isFreelancer = wallet === job.freelancer || userRole === "freelancer";

  // Effective state: If we have preview data (jobStatus), treat state as 1 (Submitted) 
  // unless it's already higher (Approved/Rejected)
  // Effective state priority:
  // 1. Fraud Flag -> 3 (Terminated)
  // 2. State 0 + Submission -> 1 (Submitted)
  // 3. Otherwise -> Actual State
  const effectiveState = job.fraudFlagRaised ? 3 : ((job.state === 0 && jobStatus) ? 1 : job.state);

  return (
    <div style={{ paddingTop: "8rem", paddingBottom: "4rem", paddingLeft: "2rem", paddingRight: "2rem", minHeight: "100vh" }}>
      <div className="page-header" style={{ maxWidth: "800px", margin: "0 auto 2rem auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/")}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            ← Back
          </button>
          <div className="page-title">
            <h1>Job Details <span style={{ opacity: 0.5, fontSize: "1.2rem" }}>#{jobId}</span></h1>
          </div>
        </div>
      </div>

      <div className="glass-card animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
        {error && <div className="message-alert alert-error">{error}</div>}

        <div className="grid-cols-3" style={{ display: "grid", gap: "2rem", marginBottom: "2.5rem" }}>
          <div style={{ padding: "1.5rem", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>Escrow Amount</label>
            <div style={{ fontSize: "2rem", color: "var(--success)", fontWeight: "800" }}>
              ${job.amount}
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>Status</label>
            <div className={`status-badge ${getStatusClass(job.state) || ""}`} style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>
              {getStateLabel(job.state)}
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <label style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "block" }}>Deadline</label>
            <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {new Date(job.deadline).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--text-main)" }}>Description</h3>
          <div style={{ padding: "1.5rem", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", lineHeight: "1.8", color: "var(--text-main)" }}>
            {job.description}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          <div>
            <strong>Client Wallet:</strong>
            <div style={{ fontFamily: "monospace", marginTop: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "6px" }}>
              {job.client}
            </div>
          </div>
          <div>
            <strong>Freelancer Wallet:</strong>
            <div style={{ fontFamily: "monospace", marginTop: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "6px" }}>
              {job.freelancer}
            </div>
          </div>
        </div>

        {/* Fraud Flag Warning */}
        {job.fraudFlagRaised && (
          <div className="message-alert alert-error" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <strong>Fraud Flag Raised</strong> - Client has reported fraudulent behavior on this job.
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Flagged on: {new Date(job.fraudFlagTimestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Payment Breakdown */}
        {job.initialPaymentPercent && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(15, 23, 42, 0.4)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Payment Breakdown</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", fontSize: "0.9rem" }}>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Initial Payment ({job.initialPaymentPercent}%)</div>
                <div style={{ fontWeight: "bold", color: job.initialPaymentReleased ? "var(--success)" : "var(--text-muted)" }}>
                  ${(job.amount * job.initialPaymentPercent / 100).toFixed(2)}
                  {job.initialPaymentReleased && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginLeft: '4px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Remaining ({100 - job.initialPaymentPercent}%)</div>
                <div style={{ fontWeight: "bold" }}>
                  ${(job.amount * (100 - job.initialPaymentPercent) / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Total</div>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>${job.amount}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fraud Flag Option (for Client) */}
      {isClient && job.state === 0 && job.initialPaymentReleased && !job.fraudFlagRaised && (
        <div className="glass-card" style={{ marginTop: "2rem", border: "1px solid var(--warning)", background: "rgba(251, 191, 36, 0.05)", maxWidth: "800px", margin: "2rem auto" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--warning)", display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Freelancer Not Responding?
          </h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            If the freelancer has received the initial payment but hasn't submitted any work, you can raise a fraud flag.
            This will be permanently recorded on the blockchain and visible on their profile.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleRaiseFraudFlag}
            disabled={rejecting}
          >
            {rejecting ? "Raising Flag..." : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                Raise Fraud Flag
              </span>
            )}
          </button>
        </div>
      )}

      {/* Submission Preview (for Client) */}
      {
        isClient && jobStatus && (
          <div className="glass-card" style={{ marginTop: "2rem", borderTop: "4px solid var(--primary)" }}>
            <h3 style={{ marginBottom: "1.5rem", display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              Work Submission Review
            </h3>

            <div className="message-alert alert-info">
              Freelancer has submitted work. Review the preview below before approving payment.
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>Watermarked Preview:</label>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <a
                  href={jobStatus.previewURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    View Preview File
                  </span>
                </a>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  Submitted: {jobStatus.submittedAt}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
              {/* Debug info - remove later */}
              <div style={{ display: 'none' }}>state: {job.state}, effective: {effectiveState}</div>

              {effectiveState === 3 ? (
                <div className="message-alert alert-error" style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Contract Terminated & Refunded (Fraud Flag). No further actions allowed.
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={approving || effectiveState !== 1}
                    style={{ flex: 1, opacity: effectiveState !== 1 ? 0.5 : 1, cursor: effectiveState !== 1 ? 'not-allowed' : 'pointer' }}
                  >
                    {approving ? "Releasing Funds..." : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Approve & Pay
                      </span>
                    )}
                  </button>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      className="btn btn-warning"
                      onClick={handleReject}
                      disabled={rejecting || effectiveState !== 1}
                      style={{ width: '100%', opacity: effectiveState !== 1 ? 0.5 : 1, cursor: effectiveState !== 1 ? 'not-allowed' : 'pointer', background: '#f59e0b', color: 'white' }}
                    >
                      {rejecting ? "Processing..." : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                          Request Revision
                        </span>
                      )}
                    </button>

                    {effectiveState === 1 && (
                      <button
                        onClick={handleRaiseFraudFlag}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        End Contract & Raise Flag
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* Submit Work (for Freelancer) */}
      {
        isFreelancer && (effectiveState === 0 || effectiveState === 4) && (
          <div className="glass-card" style={{ marginTop: "2rem", textAlign: "center", padding: "3rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>
              {effectiveState === 4 ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  Revision Requested
                </span>
              ) : "Ready to submit?"}
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
              {effectiveState === 4
                ? "The client successfully requested changes. Please upload a new version."
                : "Upload your work to the secure vault to start the review process."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/job/${jobId}/submit`)}
              style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                {effectiveState === 4 ? "Upload Revised Work" : "Upload Work File"}
              </span>
            </button>
          </div>
        )
      }

      {/* Work Submitted (for Freelancer) */}
      {
        isFreelancer && effectiveState === 1 && (
          <div className="glass-card" style={{ marginTop: "2rem", border: "1px solid var(--warning)", background: "rgba(251, 191, 36, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ color: "var(--warning)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h3 style={{ color: "var(--warning)" }}>Waiting for Client Review</h3>
                <p style={{ color: "var(--text-muted)" }}>
                  Your work has been submitted. The client will review the preview and release funds shortly.
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Approved */}
      {
        effectiveState === 2 && (
          <div className="glass-card" style={{ marginTop: "2rem", border: "1px solid var(--success)", background: "rgba(74, 222, 128, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ color: "var(--success)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <h3 style={{ color: "var(--success)" }}>Job Approved</h3>
                <p style={{ color: "var(--text-muted)" }}>
                  Funds have been released! Transaction complete.
                </p>

                {/* Show File Download for Client/Freelancer if available */}
                {(isClient || isFreelancer) && job.fileDetails && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                    <h4 style={{ marginBottom: "0.5rem", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Access Source Files
                    </h4>

                    <div className="message-alert alert-success" style={{ marginBottom: "1rem" }}>
                      <strong>Download Unencrypted File:</strong>
                      <div style={{ wordBreak: "break-all", marginTop: "0.5rem" }}>
                        <a
                          href={`http://localhost:5000/api/jobs/${jobId}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            display: 'inline-block',
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Direct Download ({job.fileDetails.fileName})
                          </span>
                        </a>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                      File released securely from backend. No decryption needed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Rejected */}
      {
        effectiveState === 3 && (
          <div className="glass-card" style={{ marginTop: "2rem", border: "1px solid var(--error)", background: "rgba(248, 113, 113, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ color: "var(--error)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <div>
                <h3 style={{ color: "var(--error)" }}>Job Rejected</h3>
                <p style={{ color: "var(--text-muted)" }}>
                  The work was rejected and funds have been returned to the client.
                </p>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default JobDetail;
