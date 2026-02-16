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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/profile" style={getLinkStyle('/profile')}>
                  Profile
                </Link>
                <button onClick={handleDisconnect} className="btn btn-secondary btn-sm">
                  Logout
                </button>
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
