'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="navbar-content">
            <h1 className="navbar-title">SahamPro Calculator</h1>
            <p className="navbar-subtitle">Analyze stock targets based on broker summary</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link 
            href="/watchlist" 
            className={`nav-link ${pathname === '/watchlist' ? 'active' : ''}`}
            style={{
              textDecoration: 'none',
              color: pathname === '/watchlist' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/watchlist' ? 600 : 400,
              paddingBottom: '0.25rem',
              borderBottom: pathname === '/watchlist' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            All Watchlist
          </Link>
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            style={{
              textDecoration: 'none',
              color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/' ? 600 : 400,
              paddingBottom: '0.25rem',
              borderBottom: pathname === '/' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Calculator
          </Link>
          <Link 
            href="/history" 
            className={`nav-link ${pathname === '/history' ? 'active' : ''}`}
            style={{
              textDecoration: 'none',
              color: pathname === '/history' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/history' ? 600 : 400,
              paddingBottom: '0.25rem',
              borderBottom: pathname === '/history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
