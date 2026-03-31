'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from './WalletProvider';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const { wallet, userRole, disconnectWallet } = useWallet();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDisconnect = () => {
    disconnectWallet();
    router.push('/login');
  };

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  // Determine styles based on auth state
  const isAuth = !!wallet;

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;

    // Auth User: White links (Right side)
    if (isAuth) {
      return {
        padding: '0.5rem 1.2rem',
        borderRadius: '8px',
        background: isActive ? '#FFFFFF' : 'transparent',
        color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.9)',
        fontWeight: isActive ? '600' : '400',
        transition: 'all 0.3s ease',
        display: 'inline-block',
        textDecoration: 'none'
      };
    }

    // Guest: Default styles
    return {
      padding: '0.5rem 1.2rem',
      borderRadius: '8px',
      background: isActive ? '#FFFFFF' : 'transparent',
      color: isActive ? '#000000' : 'var(--text-main)',
      fontWeight: isActive ? '600' : '400',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      textDecoration: 'none'
    };
  };

  return (
    <nav className="navbar" style={{
      // Auth: Transparent to show split background | Guest: Scroll-based Dark Glass
      background: isAuth
        ? 'transparent'
        : (isScrolled ? 'rgba(5, 10, 30, 0.6)' : 'transparent'),
      backdropFilter: isAuth
        ? 'blur(0px)' // Clean split, maybe subtle blur if text illegible, but clean is requested
        : (isScrolled ? 'blur(24px)' : 'none'),
      WebkitBackdropFilter: isAuth
        ? 'blur(0px)'
        : (isScrolled ? 'blur(24px)' : 'none'),
      borderBottom: isAuth
        ? 'none'
        : (isScrolled ? '1px solid rgba(0, 198, 255, 0.1)' : '1px solid transparent'),
      padding: isScrolled ? '0.4rem 0' : '0.8rem 0',
      transition: 'all 0.3s ease',
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1000
    }}>
      <div className="nav-container">
        <Link href="/" className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 20 C25 12 32 8 42 8 H80 C90 8 95 18 85 32 L68 48 H45 V85 C45 92 40 98 32 98 C25 98 20 92 20 85 V20 Z" fill="url(#logo-grad)" />
              <path d="M48 52 H80 C90 52 95 62 85 78 L72 98 H48 V52 Z" fill="url(#logo-grad)" opacity="0.8" />
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C6FF" />
                  <stop offset="100%" stopColor="#0072FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Logo Text: Dark for Auth (Left/White), White for Guest */}
          <span style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            color: isAuth ? '#0F172A' : 'transparent',
            background: isAuth ? 'none' : 'var(--gradient-primary)',
            WebkitBackgroundClip: isAuth ? 'border-box' : 'text',
            backgroundClip: isAuth ? 'border-box' : 'text'
          }}>
            FairDeal
          </span>
        </Link>

        <div className="nav-links">
          {wallet ? (
            <>
              <Link href="/" style={getLinkStyle('/')}>
                Home
              </Link>
              <Link href="/jobs" style={getLinkStyle('/jobs')}>
                Jobs
              </Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '400',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}>
                    {userRole === 'client' ? 'C' : 'F'}
                  </div>
                  Profile
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ 
                      transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      opacity: 0.8
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isProfileOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '280px',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    zIndex: 50
                  }}>
                    {/* Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0F172A', marginBottom: '0.25rem' }}>
                        {userRole === 'client' ? 'Client Account' : 'Freelancer Account'}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748B', 
                        fontFamily: 'monospace',
                        background: '#E2E8F0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        wordBreak: 'break-all'
                      }}>
                        {wallet}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '0.5rem' }}>
                      <Link 
                        href="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          color: '#334155',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          borderRadius: '8px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        My Profile
                      </Link>

                      <Link 
                        href="/jobs" 
                        onClick={() => setIsProfileOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          color: '#334155',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          borderRadius: '8px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        My Jobs
                      </Link>
                      
                    </div>

                    {/* Footer / Logout */}
                    <div style={{ padding: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={handleDisconnect}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login">
              <button className="btn" style={{ background: '#FFFFFF', color: '#000000', border: 'none' }}>Log in/Sign up</button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
