
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="landing-page" style={{ position: 'relative', overflow: 'hidden' }}>

            {/* Hero Section */}
            <section style={{
                padding: "10rem 1.5rem 8rem",
                textAlign: "center",
                position: 'relative',
                zIndex: 1
            }}>
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
                            <span style={{ animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#00C6FF', opacity: 0.75 }}></span>
                            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', background: '#00C6FF' }}></span>
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
                        <Link to="/login" className="btn btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}>
                            Get Started
                        </Link>
                        <a href="#how-it-works" className="btn btn-secondary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
                            How it works
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
                    <div className="glass-card card-hover animate-fade-in delay-100">
                        <div style={{ marginBottom: "1rem", color: "#00F5A0" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Smart Escrow</h3>
                        <p style={{ color: "var(--text-muted)" }}>Funds are locked in code, not banks. Released only when work is approved.</p>
                    </div>
                    <div className="glass-card card-hover animate-fade-in delay-200">
                        <div style={{ marginBottom: "1rem", color: "#F5E60B" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Instant Pay</h3>
                        <p style={{ color: "var(--text-muted)" }}>No net-30 days. Get paid in USDC/XLM seconds after approval.</p>
                    </div>
                    <div className="glass-card card-hover animate-fade-in delay-300">
                        <div style={{ marginBottom: "1rem", color: "#00C6FF" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Code Preview</h3>
                        <p style={{ color: "var(--text-muted)" }}>Auto-executed previews for code submissions. See it before you pay.</p>
                    </div>
                </div>
            </section>


        </div>
    );
};

export default LandingPage;
