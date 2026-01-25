'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import JobStatusIndicator from './JobStatusIndicator';

const DesktopNavbar = () => {
  const pathname = usePathname();

  return (
    <div className="desktop-nav-content">
      <div className="navbar-brand">
        <h1 className="navbar-title">RSY Analyze Stock</h1>
        <p className="navbar-subtitle">Analyze stock targets based on broker summary</p>
      </div>
      <div className="desktop-nav-links">
        <Link 
          href="/" 
          className={`nav-link ${pathname === '/' ? 'active' : ''}`}
        >
          Analyze Stock
        </Link>
        <Link 
          href="/broker-activity" 
          className={`nav-link ${pathname === '/broker-activity' ? 'active' : ''}`}
        >
          Broker Activity
        </Link>
        <Link 
          href="/hot-stock" 
          className={`nav-link ${pathname === '/hot-stock' ? 'active' : ''}`}
        >
          Hot Stock
        </Link>
        <Link 
          href="/history" 
          className={`nav-link ${pathname === '/history' ? 'active' : ''}`}
        >
          History
        </Link>
      </div>
      <div className="nav-status">
        <JobStatusIndicator />
      </div>
    </div>
  );
};

const MobileNavbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="mobile-nav-content">
      <div className="mobile-nav-header">
        <div className="navbar-brand">
          <h1 className="navbar-title">RSY Analyze Stock</h1>
        </div>
        <div className="mobile-controls">
          <JobStatusIndicator />
          <button 
            className="nav-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="mobile-nav-menu">
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Analyze Stock
          </Link>
          <Link 
            href="/broker-activity" 
            className={`nav-link ${pathname === '/broker-activity' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Broker Activity
          </Link>
          <Link 
            href="/hot-stock" 
            className={`nav-link ${pathname === '/hot-stock' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Hot Stock
          </Link>
          <Link 
            href="/history" 
            className={`nav-link ${pathname === '/history' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            History
          </Link>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {isMobile ? <MobileNavbar /> : <DesktopNavbar />}
      </div>
    </nav>
  );
};

export default Navbar;