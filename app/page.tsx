'use client';

import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import Threads component (client-side only)
const Threads = dynamic(() => import('@/components/Threads'), { ssr: false });
const Sparkles = dynamic(() => import('@/components/Sparkles'), { ssr: false });

export default function HomePage() {
  const { wallet, userRole } = useWallet();

  if (!wallet) {
    // Landing Page
    return (
      <div className="landing-page" style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0A0E27 40%, #0D1B3E 100%)'
      }}>
        {/* Full Width Glowing Wave - Left to Right */}
        <div style={{
          position: 'absolute',
          top: '-5%',
          left: 0,
          right: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
          opacity: 0.8
        }}>
          <Threads
            color={[1, 1, 1]}
            amplitude={1.5}
            distance={0}
            enableMouseInteraction={true}
          />
        </div>

        {/* Rising Sparkles Effect */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Sparkles />
        </div>

        <section style={{ padding: "6rem 1.5rem 8rem", textAlign: "center", position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

            <h1 className="hero-title animate-fade-in delay-100" style={{
              fontSize: "4rem",
              fontWeight: "700",
              lineHeight: "1.1",
              marginBottom: "2rem",
              letterSpacing: "-0.03em",
              color: "#FFFFFF"
            }}>
              The Trustless Way to <br />
              <span className="text-gradient-primary">Hire</span> & <span className="text-gradient-primary">Work</span>
            </h1>

            <div className="animate-fade-in delay-300" style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "8rem" }}>
              <Link
                href="/login"
                className="btn"
                style={{
                  padding: "0.8rem 2.5rem",
                  fontSize: "1rem",
                  background: "#FFFFFF",
                  color: "#000000",
                  borderRadius: "12px",
                  fontWeight: "600",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.15)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(255, 255, 255, 0.15)";
                }}
              >
                Get Started
              </Link>
              <button
                className="btn"
                style={{
                  padding: "0.8rem 2.5rem",
                  fontSize: "1rem",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.8)",
                  borderRadius: "12px",
                  fontWeight: "600",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onClick={() => {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        <section id="features-section" style={{ padding: "12rem 2rem 8rem", maxWidth: "1100px", margin: "0 auto", position: 'relative', zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            <div className="glass-card card-hover animate-fade-in delay-100" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: "1.5rem", color: "#00C6FF", filter: 'drop-shadow(0 0 10px rgba(0, 198, 255, 0.8))' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontWeight: '700' }}>Smart Escrow</h3>
              <p style={{ color: "var(--text-muted)", fontSize: '0.95rem' }}>Funds are locked in code, not banks. Released only when work is approved.</p>
            </div>
            <div className="glass-card card-hover animate-fade-in delay-200" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: "1.5rem", color: "#00C6FF", filter: 'drop-shadow(0 0 10px rgba(0, 198, 255, 0.8))' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontWeight: '700' }}>Instant Pay</h3>
              <p style={{ color: "var(--text-muted)", fontSize: '0.95rem' }}>No net-30 days. Get paid in USDC/XLM seconds after approval.</p>
            </div>
            <div className="glass-card card-hover animate-fade-in delay-300" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: "1.5rem", color: "#00C6FF", filter: 'drop-shadow(0 0 10px rgba(0, 198, 255, 0.8))' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontWeight: '700' }}>Code Preview</h3>
              <p style={{ color: "var(--text-muted)", fontSize: '0.95rem' }}>Auto-executed previews for code submissions. See it before you pay.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Dashboard for logged-in users (Space/Narrato Aesthetic)
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0B1026 0%, #000000 100%)', // Deep space background
      color: 'white',
      paddingTop: '8rem', // Space for fixed navbar
      position: 'relative',
      overflow: 'hidden'
      // note: global .App class might add padding, ensure this looks right
    }}>

      {/* Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 114, 255, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        top: '30%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(121, 40, 202, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }}></div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Main Hero & Quick Actions */}
        <div className="dashboard-content animate-fade-in delay-100">
          {/* Role Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '99px',
            background: 'linear-gradient(90deg, rgba(0, 198, 255, 0.1), rgba(0, 114, 255, 0.1))',
            border: '1px solid rgba(0, 198, 255, 0.3)',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: '#00C6FF',
            fontWeight: '600'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            {userRole === 'client' ? 'Client Workspace' : 'Freelancer Workspace'}
          </div>

          <h1 style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Work,<br />Securely Managed.
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94A3B8', marginBottom: '4rem', maxWidth: '600px', margin: '0 auto 4rem', lineHeight: 1.7 }}>
            Create powerful agreements without paperwork. FairDeal uses smart contracts to turn agreements into guaranteed payments.
          </p>

          {/* Quick Action Cards (Centered Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {userRole === 'client' ? (
              <>
                <Link href="/create-job" className="glass-card card-hover" style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(0, 114, 255, 0.1), rgba(0,0,0,0))',
                  border: '1px solid rgba(0, 198, 255, 0.2)'
                }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#0072FF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0, 114, 255, 0.3)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>Post New Job</h3>
                    <p style={{ fontSize: '1rem', color: '#94A3B8' }}>Create a smart contract escrow.</p>
                  </div>
                </Link>

                <Link href="/jobs" className="glass-card card-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>View All Jobs</h3>
                    <p style={{ fontSize: '1rem', color: '#94A3B8' }}>Track your active contracts.</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/jobs" className="glass-card card-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(0, 245, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 245, 160, 0.2)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00F5A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>Assigned Jobs</h3>
                    <p style={{ fontSize: '1rem', color: '#94A3B8' }}>View work assigned to you.</p>
                  </div>
                </Link>

                <div style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', fontSize: '1rem', color: '#94A3B8', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Contact clients to get hired via Smart Contracts.
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
