import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from '../config/api';

interface Job {
  id: number;
  client: string;
  freelancer: string;
  amount: number;
  description: string;
  deadline: string;
  state: number;
}

interface DashboardProps {
  wallet: string | null;
  userRole: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ wallet, userRole }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>("all"); // all, created, submitted

  useEffect(() => {
    // In MVP, we'll load mock data
    // In production, this would call the smart contract
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Fetch jobs from backend API
      const response = await axios.get(API_ENDPOINTS.JOBS);

      if (response.data.success) {
        setJobs(response.data.jobs);
        console.log(`Loaded ${response.data.count} jobs from backend`);
      } else {
        console.error("Failed to load jobs");
        setJobs([]);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      // If backend is not available, show empty state
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (state: number) => {
    const states: { [key: number]: string } = {
      0: "status-created",
      1: "status-submitted",
      2: "status-approved",
      3: "status-rejected",
      4: "status-refunded",
    };
    return states[state] || "status-created";
  };

  const getStatusLabel = (state: number) => {
    const labels: { [key: number]: string } = {
      0: "Created",
      1: "Submitted",
      2: "Approved",
      3: "Rejected",
      4: "Refunded",
    };
    return labels[state] || "Unknown";
  };

  const filteredJobs = jobs.filter((job: Job) => {
    // Filter by wallet address - show jobs where user is client OR freelancer
    const isMyJob = job.client === wallet || job.freelancer === wallet;

    if (!isMyJob) return false; // Only show jobs relevant to this wallet

    // Then apply status filter
    if (filter === "created") return job.state === 0;
    if (filter === "submitted") return job.state === 1;
    return true; // "all" filter
  });

  return (
    <div>
      <div className="page-header" style={{ padding: "6rem 0 4rem 0", background: "radial-gradient(50% 50% at 50% 50%, rgba(37, 99, 235, 0.05) 0%, rgba(255, 255, 255, 0) 100%)", textAlign: "center", display: "block", borderBottom: "none", marginBottom: "0" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "4rem", marginBottom: "1.5rem", lineHeight: "1.1" }}>
            The <span style={{ color: "var(--primary)" }}>Smartest</span> Way to Hire & Work.
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--text-muted)", marginBottom: "3rem", margin: "0 auto 3rem auto", maxWidth: "600px" }}>
            FairDeal connects clients and freelancers with a trustless escrow, ensuring you only pay for results and always get paid for your work.
          </p>

          {userRole === "client" && (
            <Link to="/create-job" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Get Started — Create Job
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Recent Opportunities</h3>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "0.5rem 1rem", width: "auto", minWidth: "150px" }}
            >
              <option value="all">All Jobs</option>
              <option value="created">Created</option>
              <option value="submitted">Submitted Work</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading available jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-alt)", borderRadius: "12px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>📭</div>
            <p style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>No jobs found in this category.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job) => (
              <Link key={job.id} to={`/job/${job.id}`} className="job-card-link">
                <div className="glass-card job-card card-hover">
                  <div className="job-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="job-id">JOB-{job.id}</span>
                    <span className={`status-badge ${getStatusClass(job.state)}`}>
                      {getStatusLabel(job.state)}
                    </span>
                  </div>

                  <div className="job-amount">
                    ${job.amount} <span>USD</span>
                  </div>

                  <div className="job-description">
                    {job.description}
                  </div>

                  <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "500" }}>
                    Due: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
