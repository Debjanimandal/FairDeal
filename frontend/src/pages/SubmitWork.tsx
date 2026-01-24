import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface SubmitWorkProps {
  wallet: string | null;
}

const SubmitWork: React.FC<SubmitWorkProps> = ({ wallet }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [submissionData, setSubmissionData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        if (selectedFile.size > 50 * 1024 * 1024) {
          // 50MB limit
          setError("File size must be less than 50MB");
          return;
        }
        setFile(selectedFile);
        setError("");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("active");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("active");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("active");

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("jobId", jobId || "");
      formData.append("freelancerAddress", wallet || "");
      formData.append("file", file);

      const response = await axios.post("/api/jobs/submit-work", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Work submitted successfully!");
      setSubmissionData(response.data);
      setFile(null);
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
    <div>
      <div className="page-header">
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

      <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto" }}>

        {error && <div className="message-alert alert-error">⚠️ {error}</div>}
        {success && <div className="message-alert alert-success">✅ {success}</div>}

        {!submissionData ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select File to Upload *</label>

              <div
                className="file-upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <div className="file-icon">📁</div>
                <p style={{ fontWeight: "bold", color: "var(--primary)", fontSize: "1.1rem" }}>
                  {file
                    ? `Selected: ${file.name}`
                    : "Drag and drop your file here or click to browse"}
                </p>
                <small style={{ color: "var(--text-muted)" }}>
                  Supported: Images, PDFs, Documents, Code, Archives (Max 50MB)
                </small>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {file && (
              <div
                style={{
                  padding: "1rem",
                  background: "rgba(15, 23, 42, 0.4)",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>File Name:</span>
                  <strong>{file.name}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Size:</span>
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Type:</span>
                  <span>{file.type || "Unknown"}</span>
                </div>
              </div>
            )}

            <div className="message-alert alert-info">
              <div>
                <strong>🔐 Security & Privacy Process:</strong>
                <ol style={{ marginTop: "0.5rem", marginLeft: "1.5rem", lineHeight: "1.6" }}>
                  <li>Original file will be encrypted locally with AES-256</li>
                  <li>A separate watermarked preview will be generated</li>
                  <li>Both versions are pinned to IPFS for permanence</li>
                  <li>Client only sees the preview until they approve payment</li>
                </ol>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!file || loading}
                style={{ flex: 2, padding: "1rem" }}
              >
                {loading ? "Uploading & Encrypting..." : "✅ Submit Work Securely"}
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
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
            <h3 style={{ fontSize: "1.8rem", color: "var(--success)", marginBottom: "1rem" }}>Work Submitted Successfully!</h3>

            <div style={{ background: "rgba(15, 23, 42, 0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "left", marginBottom: "2rem" }}>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "var(--text-muted)" }}>Job ID:</strong> {submissionData.jobId}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong style={{ color: "var(--text-muted)" }}>Preview CID:</strong>
                <span style={{ fontFamily: "monospace", marginLeft: "0.5rem", color: "var(--primary)" }}>{submissionData.previewCID}</span>
              </p>

              <div className="message-alert alert-info" style={{ marginTop: "1.5rem" }}>
                <strong>Preview URL:</strong>
                <div className="preview-url" style={{ marginTop: "0.5rem" }}>
                  https://w3s.link/ipfs/{submissionData.previewCID}
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
