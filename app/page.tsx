'use client';

import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function HomePage() {
  const { wallet, userRole } = useWallet();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (wallet) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [wallet]);

  // Refetch jobs when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (wallet) {
        fetchJobs();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [wallet]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      
      if (response.data.success) {
        setJobs(response.data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (state: number) => {
    const states: { [key: number]: string } = {
      0: 'status-created',
      1: 'status-submitted',
      2: 'status-approved',
      3: 'status-rejected',
      4: 'status-refunded',
    };
    return states[state] || 'status-created';
  };

  const getStatusLabel = (state: number) => {
    const labels: { [key: number]: string } = {
      0: 'Created',
      1: 'Submitted',
      2: 'Approved',
      3: 'Rejected',
      4: 'Refunded',
    };
    return labels[state] || 'Unknown';
  };

  const filteredJobs = jobs.filter((job: any) => {
    // Filter by wallet address - show jobs where user is client OR freelancer
    const isMyJob = job.client === wallet || job.freelancer === wallet;

    if (!isMyJob) return false;

    // Then apply status filter
    if (filter === 'created') return job.state === 0;
    if (filter === 'submitted') return job.state === 1;
    return true;
  });

  if (!wallet) {
    // Landing Page
    return (
      <div className="landing-page" style={{ position: 'relative', overflow: 'hidden' }}>
        <section style={{ padding: "10rem 1.5rem 8rem", textAlign: "center", position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div className="animate-fade-in" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.5rem",
              borderRadius: "99px",
              background: "rgba(0, 114, 255, 0.1)",
              border: "1px solid rgba(0, 114, 255, 0.2)",
              color: "#00C6FF",
              fontWeight: "600",
              fontSize: "0.9rem",
              marginBottom: "2rem"
            }}>
              <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                <span className="pulse-ring"></span>
                <span className="pulse-dot"></span>
              </span>
              Live on Stellar Testnet
            </div>

            <h1 className="hero-title animate-fade-in delay-100">
              The Trustless Way to <br />
              <span className="text-gradient-primary">Hire</span> & <span className="text-gradient-accent">Work.</span>
            </h1>

            <p className="animate-fade-in delay-200" style={{
              fontSize: "1.35rem",
              color: "var(--text-muted)",
              maxWidth: "650px",
              margin: "0 auto 3.5rem",
              lineHeight: "1.6"
            }}>
              FairDeal replaces middleman fees with smart contracts.
              Secure escrow, instant settlement, and verifiable reputation for the gig economy.
            </p>

            <div className="animate-fade-in delay-300" style={{ display: "flex", gap: "1.5rem", justifyContent: "center" }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}>
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <section style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="glass-card card-hover animate-fade-in delay-100">
              <div style={{ marginBottom: "1rem", color: "#00F5A0", fontSize: "2.5rem" }}>🛡️</div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Smart Escrow</h3>
              <p style={{ color: "var(--text-muted)" }}>Funds are locked in code, not banks. Released only when work is approved.</p>
            </div>
            <div className="glass-card card-hover animate-fade-in delay-200">
              <div style={{ marginBottom: "1rem", color: "#F5E60B", fontSize: "2.5rem" }}>⚡</div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Instant Pay</h3>
              <p style={{ color: "var(--text-muted)" }}>No net-30 days. Get paid in USDC/XLM seconds after approval.</p>
            </div>
            <div className="glass-card card-hover animate-fade-in delay-300">
              <div style={{ marginBottom: "1rem", color: "#00C6FF", fontSize: "2.5rem" }}>💻</div>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Code Preview</h3>
              <p style={{ color: "var(--text-muted)" }}>Auto-executed previews for code submissions. See it before you pay.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div>
      <div className="page-header" style={{ padding: '6rem 0 4rem 0', background: 'radial-gradient(50% 50% at 50% 50%, rgba(37, 99, 235, 0.05) 0%, rgba(255, 255, 255, 0) 100%)', textAlign: 'center', display: 'block', borderBottom: 'none', marginBottom: '0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
            The <span style={{ color: 'var(--primary)' }}>Smartest</span> Way to Hire & Work.
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', margin: '0 auto 3rem auto', maxWidth: '600px' }}>
            FairDeal connects clients and freelancers with a trustless escrow, ensuring you only pay for results and always get paid for your work.
          </p>

          {userRole === 'client' && (
            <Link href="/create-job" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Get Started — Create Job
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Recent Opportunities</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Jobs</option>
              <option value="created">Created</option>
              <option value="submitted">Submitted Work</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading available jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-alt)', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No jobs found in this category.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job: any) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="job-card-link">
                <div className="glass-card job-card card-hover">
                  <div className="job-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
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
}
