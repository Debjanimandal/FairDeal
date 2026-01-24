import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section style={{
                padding: "8rem 1.5rem 6rem",
                textAlign: "center",
                background: "radial-gradient(circle at center, rgba(37, 99, 235, 0.03) 0%, transparent 70%)"
            }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <div style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        borderRadius: "99px",
                        background: "var(--primary-light)",
                        color: "var(--primary)",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        marginBottom: "1.5rem"
                    }}>
                        ✨ Now live on Stellar Mainnet
                    </div>

                    <h1 style={{
                        fontSize: "5rem",
                        fontWeight: "800",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.1",
                        marginBottom: "1.5rem",
                        color: "var(--text-main)"
                    }}>
                        The Trustless Way to <br />
                        <span style={{ color: "var(--primary)" }}>Hire & Work.</span>
                    </h1>

                    <p style={{
                        fontSize: "1.25rem",
                        color: "var(--text-muted)",
                        maxWidth: "600px",
                        margin: "0 auto 3rem",
                        lineHeight: "1.6"
                    }}>
                        FairDeal replaces middleman fees with smart contracts.
                        Secure escrow, instant settlement, and verifiable reputation for the gig economy.
                    </p>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                        <Link to="/login" className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
                            Get Started
                        </Link>
                        <a href="#how-it-works" className="btn btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
                            How it works
                        </a>
                    </div>
                </div>
            </section>


        </div>
    );
};

export default LandingPage;
