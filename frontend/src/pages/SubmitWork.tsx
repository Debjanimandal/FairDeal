import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from '../config/api';

interface SubmitWorkProps {
  wallet: string | null;
}

const SubmitWork: React.FC<SubmitWorkProps> = ({ wallet }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [submissionData, setSubmissionData] = useState<any>(null);

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

      setSuccess("Work submitted successfully!");
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
    <div style={{ paddingTop: "8rem", paddingBottom: "4rem", paddingLeft: "2rem", paddingRight: "2rem", minHeight: "100vh" }}>
      <div className="page-header" style={{ maxWidth: "800px", margin: "0 auto 2rem auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/job/${jobId}`)}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            ← Back to Job
          </button>
          <div className="page-title">
            <h1>Submit Work</h1>
            <p>Upload your deliverables securely.</p>
          </div>
        </div>
      </div>

      <div className="glass-card animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>

        {error && <div className="message-alert alert-error">{error}</div>}
        {success && <div className="message-alert alert-success">{success}</div>}

        {!submissionData ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Code Folder or Files to Upload *</label>

              {/* Folder/File input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="form-input"
                multiple
                {...({ webkitdirectory: "", directory: "" } as any)}
                style={{
                  padding: "0.75rem",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              />

              {files.length > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(15, 23, 42, 0.4)",
                    borderRadius: "8px",
                    marginTop: "1rem",
                    border: "1px solid var(--border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Files Selected:</span>
                    <strong>{files.length} file(s)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Size:</span>
                    <span>{(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div style={{ marginTop: "0.75rem", maxHeight: "150px", overflowY: "auto" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Files:</div>
                    {files.map((f, idx) => (
                      <div key={idx} style={{ fontSize: "0.85rem", padding: "0.25rem 0" }}>• {f.name}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="message-alert alert-info">
                <div>
                  <strong>Security & Privacy Process:</strong>
                  <ol style={{ marginTop: "0.5rem", marginLeft: "1.5rem", lineHeight: "1.6" }}>
                    <li>Code folder will be compressed into ZIP and encrypted with AES-256</li>
                    <li>A code execution preview will be generated for client review</li>
                    <li>Both encrypted ZIP and preview are pinned to IPFS</li>
                    <li>Client sees only execution preview until they approve payment</li>
                    <li>Source code is revealed only after approval</li>
                  </ol>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={files.length === 0 || loading}
                style={{ flex: 2, padding: "1rem" }}
              >
                {loading ? "Uploading & Processing..." : `Submit ${files.length > 0 ? files.length + ' File(s)' : 'Work'} Securely`}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/job/${jobId}`)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ color: "var(--success)", display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 style={{ fontSize: "1.8rem", color: "var(--success)", marginBottom: "1rem" }}>Work Submitted Successfully!</h3>

            <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "left", marginBottom: "2rem" }}>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "var(--text-muted)" }}>Job ID:</strong> {submissionData.jobId}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "var(--text-muted)" }}>Job ID:</strong> {submissionData.jobId}
              </p>

              {submissionData.previewCID && (
                <p style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "var(--text-muted)" }}>Preview CID:</strong>
                  <span style={{ fontFamily: "monospace", marginLeft: "0.5rem", color: "var(--primary)" }}>{submissionData.previewCID}</span>
                </p>
              )}

              <div className="message-alert alert-info" style={{ marginTop: "1.5rem" }}>
                <strong>Preview URL:</strong>
                <div className="preview-url" style={{ marginTop: "0.5rem", wordBreak: "break-all" }}>
                  <a href={submissionData.previewURL || `https://w3s.link/ipfs/${submissionData.previewCID}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                    {submissionData.previewURL || `https://w3s.link/ipfs/${submissionData.previewCID}`}
                  </a>
                </div>
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  Share this link with the client if needed. They can review it directly from their dashboard.
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate(`/job/${jobId}`)}
              style={{ width: "100%", padding: "1rem" }}
            >
              Back to Job Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitWork;
