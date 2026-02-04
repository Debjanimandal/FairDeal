'use client';

import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { useRouter } from 'next/navigation';
import { requestAccess } from '@stellar/freighter-api';
import Link from 'next/link';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>('client');
  const { connectWallet } = useWallet();
  const router = useRouter();

  const handleConnectWallet = async () => {
    try {
      const { address, error } = await requestAccess();

      if (error) {
        console.error("Freighter error:", error);
        alert("Freighter connection error: " + error);
        return;
      }

      if (address) {
        connectWallet(address, selectedRole);
        router.push('/');
        return;
      }

      alert("Failed to get wallet address from Freighter.");
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      if (error.message?.includes("not installed")) {
        alert("Freighter wallet not detected. Please install the Freighter extension to continue.");
        window.open("https://www.freighter.app/", "_blank");
      } else {
        alert("Failed to connect wallet: " + error.message);
      }
    }
  };

  return (
    <div className="login-page-habu" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",

      minHeight: "100vh",
      background: '#ffffff', // White background as requested
      color: '#000000', // Dark text for contrast on white visual

      fontFamily: 'var(--font-main)',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* Background Ambience (Optional) */}
      {/* Background Ambience Removed for clean white look */}

      {/* Back Arrow at Top Left (Page Level) */}
      <div className="logo-section" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 100 }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: '#000000', // Dark text for white background
          transition: 'color 0.3s ease'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'rgba(0, 0, 0, 0.05)', // Light gray background
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 0, 0, 0.1)' // Darker border
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Back to Home</span>
        </Link>
      </div>

      {/* CENTRAL CARD CONTAINER */}
      <div className="login-card" style={{
        display: 'flex',
        width: '90%',
        maxWidth: '1200px', // Restrict max width nicely
        height: '80vh', // Fixed height for the modal look
        maxHeight: '800px',
        background: 'rgba(255, 255, 255, 0.03)', // Subtle glass border/bg
        backdropFilter: 'blur(20px)',
        borderRadius: '32px', // Large rounded corners like reference
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',

        zIndex: 10,
        animation: 'slideInLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>

        {/* LEFT PANEL: VISUALS (Dark/Teal Theme like image but with our colors) */}
        <div className="left-panel" style={{
          flex: 1,
          background: 'linear-gradient(135deg, #02040F 0%, #001233 100%)', // Deep dark
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4rem',
          overflow: 'hidden'
        }}>
          {/* Abstract Gradient Glow */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle at center, rgba(0, 198, 255, 0.15), transparent 60%)',
            filter: 'blur(60px)',
          }}></div>

          {/* Dynamic Flow Line (CSS Curve) */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%',
            background: 'linear-gradient(to top right, rgba(0, 198, 255, 0.1), transparent)',
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 40%, 0% 0%)',
            backdropFilter: 'blur(10px)'
          }}></div>

          {/* Content on Left */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Secure Escrow<br />For The Future.
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', maxWidth: '80%' }}>
              Smart contracts that guarantee peace of mind for every transaction.
            </p>
          </div>

        </div>

        {/* RIGHT PANEL: FORM (Light/Clean side) */}
        <div className="right-panel" style={{
          flex: 1,
          background: '#ffffff', // White background
          padding: '4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderLeft: '1px solid rgba(0,0,0,0.05)' // Subtle divider
        }}>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1a1a1a' }}>Get Started</h1>
          <p style={{ color: '#666666', marginBottom: '3rem' }}>Connect your wallet to access the dashboard.</p>

          {/* Role Selector */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '1rem'
            }}>
              I am connecting as
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div
                onClick={() => setSelectedRole('client')}
                style={{
                  padding: '1.2rem',
                  borderRadius: '16px',
                  background: selectedRole === 'client' ? 'rgba(0, 198, 255, 0.08)' : '#f5f5f7', // Light gray inactive
                  border: selectedRole === 'client' ? '2px solid #00C6FF' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedRole === 'client' ? '#00C6FF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: selectedRole === 'client' ? '#0072FF' : '#333333' }}>Client</div>
              </div>

              <div
                onClick={() => setSelectedRole('freelancer')}
                style={{
                  padding: '1.2rem',
                  borderRadius: '16px',
                  background: selectedRole === 'freelancer' ? 'rgba(0, 198, 255, 0.08)' : '#f5f5f7', // Light gray inactive
                  border: selectedRole === 'freelancer' ? '2px solid #00C6FF' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedRole === 'freelancer' ? '#00C6FF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: selectedRole === 'freelancer' ? '#0072FF' : '#333333' }}>Freelancer</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectWallet}
            className="btn"
            style={{
              width: '100%',
              padding: '1.2rem',
              background: '#000000', // Black button
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '1.1rem',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 30px -10px rgba(0, 198, 255, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            Connect Freighter Wallet
          </button>

        </div>

      </div>
      <style jsx global>{`
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-100px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        /* Override global layout padding for this page only */
        .App {
          padding-top: 0 !important;
        }
      `}</style>
    </div >
  );
}