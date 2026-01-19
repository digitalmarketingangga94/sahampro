'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="navbar-logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Central vertical axis */}
              <rect x="49" y="10" width="2" height="80" fill="currentColor" />
              {/* Candle/Balance body */}
              <rect x="44" y="32" width="12" height="38" fill="currentColor" />
              {/* Top yoke / curved bar */}
              <path d="M22 30C40 18 60 22 80 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              {/* Left hook detail */}
              <path d="M22 30C18 30 16 38 22 42C24 44 28 42 28 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Connecting wires/lines to the bottom corner of the body */}
              <line x1="22" y1="30" x2="44" y2="70" stroke="currentColor" strokeWidth="1.5" />
              <line x1="80" y1="32" x2="56" y2="70" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="navbar-content">
            <h1 className="navbar-title">Adimology Calculator</h1>
            <p className="navbar-subtitle">Analyze stock targets based on broker summary</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
