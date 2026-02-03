'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import JobStatusIndicator from './JobStatusIndicator'; // Dihapus

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="navbar-content">
            <h1 className="navbar-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>RSY Analyze Stock</h1>
            <p className="navbar-subtitle" style={{ fontSize: '0.75rem' }}>Analyze stock targets based on broker summary</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '1.5rem' }}>
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
              Analyze Stock
            </Link>
            <Link 
              href="/insider-activity" 
              style={{
                textDecoration: 'none',
                color: pathname === '/insider-activity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/insider-activity' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/insider-activity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Insider Activity
            </Link>
            <Link 
              href="/broker-activity" 
              style={{
                textDecoration: 'none',
                color: pathname === '/broker-activity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/broker-activity' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/broker-activity' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Broker Activity
            </Link>
            <Link 
              href="/hot-stock" 
              style={{
                textDecoration: 'none',
                color: pathname === '/hot-stock' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/hot-stock' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/hot-stock' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Hot Stock
            </Link>
            <Link 
              href="/net-foreign-buy" 
              style={{
                textDecoration: 'none',
                color: pathname === '/net-foreign-buy' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/net-foreign-buy' ? 600 : 400,
                fontSize: '0.9rem',
                borderBottom: pathname === '/net-foreign-buy' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                paddingBottom: '2px',
                transition: 'all 0.2s'
              }}
            >
              Net Foreign Buy
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
          {/* <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <JobStatusIndicator />
          </div> */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;