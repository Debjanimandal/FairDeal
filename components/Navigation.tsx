'use client';

import Link from 'next/link';
import { useWallet } from './WalletProvider';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const { wallet, userRole, disconnectWallet } = useWallet();
  const pathname = usePathname();
  const router = useRouter();

  const handleDisconnect = () => {
    disconnectWallet();
    router.push('/login');
  };

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo-container">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M2 9a3 3 0 0 1 0 0L12 2l10 7a3 3 0 0 1 0 0v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z" stroke="url(#gradient1)" strokeWidth="2" fill="none"/>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C6FF"/>
                  <stop offset="100%" stopColor="#0072FF"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-gradient-primary">FairDeal</span>
        </Link>

        <div className="nav-links">
          {wallet ? (
            <>
              <Link href="/">
                <span className="nav-link">Dashboard</span>
              </Link>
              {userRole === 'client' && (
                <Link href="/create-job">
                  <span className="nav-link">Post Job</span>
                </Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(0, 245, 160, 0.1)',
                  border: '1px solid rgba(0, 245, 160, 0.2)',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: 'var(--success)'
                }}>
                  {userRole === 'client' ? '👔 Client' : '💼 Freelancer'}
                </div>
                <button onClick={handleDisconnect} className="btn btn-secondary btn-sm">
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <button className="btn btn-primary">Connect Wallet</button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
