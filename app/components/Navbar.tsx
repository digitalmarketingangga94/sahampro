'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LineChart as LineChartIcon, Menu, X } from 'lucide-react';


const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="navbar-content">
            <h1 className="navbar-title">RSY</h1>
            {/* Removed the subtitle as requested */}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links-desktop">
          
          <Link 
            href="/" 
            onClick={closeMenu}
            className={pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Analyze Stock
          </Link>
          <Link 
            href="/idx-sector" 
            onClick={closeMenu}
            className={pathname === '/idx-sector' ? 'nav-link active' : 'nav-link'}
          >
            IDX Sector
          </Link>
          
          <Link 
            href="/broker-activity" 
            onClick={closeMenu}
            className={pathname === '/broker-activity' ? 'nav-link active' : 'nav-link'}
          >
            Broker Activity
          </Link>
          <Link 
            href="/top-stock" 
            onClick={closeMenu}
            className={pathname === '/top-stock' ? 'nav-link active' : 'nav-link'}
          >
            Top Stock
          </Link>
          <Link 
            href="/insider-activity" 
            onClick={closeMenu}
            className={pathname === '/insider-activity' ? 'nav-link active' : 'nav-link'}
          >
            Insider Activity
          </Link>
          <Link 
            href="/hot-stock" 
            onClick={closeMenu}
            className={pathname === '/hot-stock' ? 'nav-link active' : 'nav-link'}
          >
            Hot Stock
          </Link>
          <Link 
            href="/net-foreign-buy" 
            onClick={closeMenu}
            className={pathname === '/net-foreign-buy' ? 'nav-link active' : 'nav-link'}
          >
            Net Foreign Buy
          </Link>
          <Link 
            href="/history" 
            onClick={closeMenu}
            className={pathname === '/history' ? 'nav-link active' : 'nav-link'}
          >
            History
          </Link>
        </div>

        {/* Mobile Hamburger Icon */}
        <button className="mobile-menu-button" onClick={toggleMenu}>
          <Menu size={24} />
        </button>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
          <button className="mobile-menu-close-button" onClick={toggleMenu}>
            <X size={24} />
          </button>
          <div className="mobile-nav-links">
            
            <Link 
              href="/" 
              onClick={closeMenu}
              className={pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Analyze Stock
            </Link>
            <Link 
            href="/idx-sector" 
            onClick={closeMenu}
            className={pathname === '/idx-sector' ? 'nav-link active' : 'nav-link'}
          >
            IDX Sector
          </Link>
            
            <Link 
              href="/broker-activity" 
              onClick={closeMenu}
              className={pathname === '/broker-activity' ? 'nav-link active' : 'nav-link'}
            >
              Broker Activity
            </Link>
            <Link 
              href="/top-stock" 
              onClick={closeMenu}
              className={pathname === '/top-stock' ? 'nav-link active' : 'nav-link'}
            >
              Top Stock
            </Link>
            <Link 
              href="/insider-activity" 
              onClick={closeMenu}
              className={pathname === '/insider-activity' ? 'nav-link active' : 'nav-link'}
            >
              Insider Activity
            </Link>
            <Link 
              href="/hot-stock" 
              onClick={closeMenu}
              className={pathname === '/hot-stock' ? 'nav-link active' : 'nav-link'}
            >
              Hot Stock
            </Link>
            <Link 
              href="/net-foreign-buy" 
              onClick={closeMenu}
              className={pathname === '/net-foreign-buy' ? 'nav-link active' : 'nav-link'}
            >
              Net Foreign Buy
            </Link>
            <Link 
              href="/history" 
              onClick={closeMenu}
              className={pathname === '/history' ? 'nav-link active' : 'nav-link'}
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;