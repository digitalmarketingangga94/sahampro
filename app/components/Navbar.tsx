'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import JobStatusIndicator from './JobStatusIndicator';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="navbar-content">
            <h1 className="navbar-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>RSY Calculator</h1>
            <p className="navbar-subtitle" style={{ fontSize: '0.75rem' }}>Analyze stock targets based on broker summary</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '1.5rem' }}>
            <Link 
              href="/dashboard" 
              style={{
                textDecoration: 'none',
                color: pathname === '/dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/dashboard' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/dashboard' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Dashboard
            </Link>
            <Link 
              href="/" 
              style={{
                textDecoration: 'none',
                color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Calculator
            </Link>
            <Link 
              href="/watchlist" 
              style={{
                textDecoration: 'none',
                color: pathname === '/watchlist' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/watchlist' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/watchlist' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Watchlist
            </Link>
            <Link 
              href="/tradebook" 
              style={{
                textDecoration: 'none',
                color: pathname === '/tradebook' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/tradebook' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/tradebook' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Tradebook
            </Link>
            <Link 
              href="/history" 
              style={{
                textDecoration: 'none',
                color: pathname === '/history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/history' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              History
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <JobStatusIndicator />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;