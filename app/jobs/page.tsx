'use client';

import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function JobsPage() {
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

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top, #0B1026 0%, #000000 100%)', // Deep space background
            color: 'white',
            paddingTop: '8rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Glows */}
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

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>

                {/* Header & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                            Your Jobs
                        </h1>
                        <p style={{ color: '#94A3B8', fontSize: '1.1rem' }}>Manage your contracts and track payments.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {userRole === 'client' && (
                            <Link href="/create-job" className="btn" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.8rem 1.5rem',
                                background: '#FFFFFF',
                                color: '#000000',
                                fontWeight: '600',
                                borderRadius: '12px',
                                transition: 'transform 0.2s',
                                border: 'none'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Post New Job
                            </Link>
                        )}

                        <div style={{ position: 'relative' }}>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    padding: '0.8rem 2.5rem 0.8rem 1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    minWidth: '160px'
                                }}
                            >
                                <option value="all" style={{ color: 'black' }}>All Status</option>
                                <option value="created" style={{ color: 'black' }}>Created</option>
                                <option value="submitted" style={{ color: 'black' }}>Submitted</option>
                            </select>
                            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>Syncing with blockchain...</div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="glass-card" style={{ gridColumn: '1/-1', padding: '6rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>No jobs found</h3>
                                <p style={{ color: '#94A3B8', marginTop: '0.5rem' }}>You haven't created or been assigned any jobs yet.</p>
                            </div>
                            {userRole === 'client' && (
                                <Link href="/create-job" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                                    Create First Job
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredJobs.map((job: any) => (
                            <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                                <div className="glass-card card-hover"
                                    style={{
                                        padding: '1.5rem',
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 0 20px rgba(110, 212, 240, 0.86)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                                {/* Black Icon */}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                            </div>
                                            <div>
                                                {/* Black ID */}
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#000000', marginBottom: '4px' }}>#{job.id}</h4>
                                            </div>
                                        </div>
                                        <div className={`status-badge ${getStatusClass(job.state)}`} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                            {getStatusLabel(job.state)}
                                        </div>
                                    </div>

                                    {/* Black Description */}
                                    <p style={{ color: '#000000', fontSize: '1rem', fontWeight: '500', marginBottom: '1.5rem', lineHeight: 1.6, flex: 1 }}>
                                        {job.description}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                                        {/* Blue Amount */}
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0072FF' }}>
                                            ${job.amount} <span style={{ fontSize: '0.85rem', color: '#000000', fontWeight: '600' }}>USDC</span>
                                        </div>
                                        {/* Black Date */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#000000', fontWeight: '500' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {new Date(job.deadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
