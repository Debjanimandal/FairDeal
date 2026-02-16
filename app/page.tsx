'use client';

import { useWallet } from '@/components/WalletProvider';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import Threads component (client-side only)
const Threads = dynamic(() => import('@/components/Threads'), { ssr: false });
const Sparkles = dynamic(() => import('@/components/Sparkles'), { ssr: false });
const Silk = dynamic(() => import('@/components/Silk'), { 
  ssr: false,
  loading: () => (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #020617 0%, #172554 100%)'
    }} />
  )
});

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

  // Dashboard for logged-in users (Split Screen Aesthetic)
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row', // Row on desktop
      flexWrap: 'wrap',     // Wrap on mobile
      overflow: 'hidden',
      background: '#041031', // Dark blue base
      marginTop: '-80px',    // Counteract global .App padding
      paddingTop: '0',
      position: 'relative'
    }}>

      {/* Curved SVG Overlay - White section with smooth wave */}
      <svg
        className="animate-in fade-in zoom-in duration-1000"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(10px 0px 20px rgba(0, 0, 0, 0.15))' // Soft shadow
        }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M0,0 L55,0 C35,35 75,65 55,100 L0,100 Z" fill="#ffffff" />
      </svg>

      {/* LEFT COLUMN: Welcome & Context (White with Curve) */}
      <div style={{
        flex: '1 1 500px',
        background: 'transparent',
        color: '#0F172A',
        padding: '10rem 6rem 4rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
        width: '75%',
        zIndex: 3
      }}>

        <div className="animate-fade-in delay-100" style={{
          position: 'relative',
          zIndex: 10
        }}>
          {/* Role Badge (Light Mode) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '99px',
            background: '#F1F5F9', // Light gray bg
            border: '1px solid #E2E8F0',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: '#0072FF', // Blue text
            fontWeight: '600'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            {userRole === 'client' ? 'Client Workspace' : 'Freelancer Workspace'}
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 4vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            color: '#0F172A', // Dark Slate
            letterSpacing: '-0.02em'
          }}>
            Your Work,<br />
            <span style={{ color: '#0072FF' }}>Securely</span> Managed.
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#475569', // Dark Gray
            marginBottom: '3rem',
            maxWidth: '500px',
            lineHeight: 1.7
          }}>
            Create powerful agreements without paperwork. FairDeal uses smart contracts to turn agreements into guaranteed payments.
          </p>

          {/* Post Your Job Button */}
          {userRole === 'client' && (
            <Link
              href="/create-job"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#172554',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '600',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(23, 37, 84, 0.3)',
                transition: 'all 0.3s ease',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(23, 37, 84, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(23, 37, 84, 0.3)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Post Your Job
            </Link>
          )}
        </div>
      </div>

      {/* 3D Bubbles Along Curve - Exact positioning from reference */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: 'none'
      }}>
        {/* Solid 3D Bubbles Along Curve - Drifting from Ocean to White */}
        {[
          { cx: '58%', cy: '10%', r: '25', duration: '12s' },
          { cx: '56%', cy: '18%', r: '15', duration: '15s' },
          { cx: '52%', cy: '28%', r: '45', duration: '18s' },  // Large bubble
          { cx: '54%', cy: '38%', r: '20', duration: '14s' },
          { cx: '56%', cy: '48%', r: '35', duration: '16s' },
          { cx: '52%', cy: '58%', r: '25', duration: '13s' },
          { cx: '58%', cy: '68%', r: '50', duration: '20s' },  // Large bubble
          { cx: '54%', cy: '82%', r: '30', duration: '17s' }
        ].map((b, i) => {
          const radius = parseFloat(b.r);
          return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${b.r}px`,
              height: `${b.r}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #3B5998, #1e3a8a, #0F2557)',
              boxShadow: `
                0 ${radius * 0.3}px ${radius * 0.6}px rgba(0, 0, 0, 0.4),
                inset -${radius * 0.1}px -${radius * 0.1}px ${radius * 0.2}px rgba(0, 0, 0, 0.5),
                inset ${radius * 0.15}px ${radius * 0.15}px ${radius * 0.25}px rgba(255, 255, 255, 0.2)
              `,
              top: b.cy,
              left: b.cx,
              transform: 'translate(-50%, -50%)',
              filter: 'brightness(1.1)',
              animation: `bubble-drift ${b.duration} ease-in-out infinite alternate`,
              animationDelay: `${i * -2}s`
            }}
          />
        );
        })}
      </div>

      {/* RIGHT COLUMN: Actions & Visuals (Dark Blue with Silk Animation) */}
      <div style={{
        flex: '1 1 500px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        minHeight: '600px',
        overflow: 'hidden',
        zIndex: 1
      }}>

        {/* Silk Shader Background with Wavy Texture */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <Silk 
            speed={3}
            scale={2}
            color="#1e3a8a"
            noiseIntensity={1.2}
            rotation={0.5}
          />
        </div>

        {/* Wavy Pattern Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
          background: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(30, 58, 138, 0.15) 20px,
              rgba(30, 58, 138, 0.15) 40px
            )
          `,
          opacity: 0.3
        }} />

      </div>

      {/* Bubble Animation Styles */}
      <style jsx>{`
        @keyframes floatLeftSlow {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translate(-600px, -50px) scale(1.1);
            opacity: 0.4;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translate(-1200px, -100px) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes floatLeftMedium {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          50% {
            transform: translate(-500px, 30px) scale(1.2);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translate(-1000px, 60px) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes floatLeftFast {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          50% {
            transform: translate(-450px, -30px) scale(1.15);
            opacity: 0.6;
          }
          85% {
            opacity: 0.4;
          }
          100% {
            transform: translate(-900px, -60px) scale(0.85);
            opacity: 0;
          }
        }

        @keyframes flowLeft {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(-100vw);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      </div>
  );
}
