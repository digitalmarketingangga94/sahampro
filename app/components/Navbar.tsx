'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TokenStatusIndicator from './TokenStatusIndicator';
import JobStatusIndicator from './JobStatusIndicator';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-card backdrop-blur-md border-b border-border-color py-3">
      <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">RSY Calculator</h1>
            <p className="text-xs md:text-sm text-text-secondary font-normal opacity-80 hidden md:block">Analyze stock targets based on broker summary</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-6">
            <Link 
              href="/" 
              className={`text-sm md:text-base font-medium transition-all pb-0.5 ${
                pathname === '/' 
                  ? 'text-text-primary border-b-2 border-accent-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:border-b-2 hover:border-border-color'
              }`}
            >
              Calculator
            </Link>
            <Link 
              href="/history" 
              className={`text-sm md:text-base font-medium transition-all pb-0.5 ${
                pathname === '/history' 
                  ? 'text-text-primary border-b-2 border-accent-primary' 
                  : 'text-text-secondary hover:text-text-primary hover:border-b-2 hover:border-border-color'
              }`}
            >
              History
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            <JobStatusIndicator />
            <TokenStatusIndicator /> {/* Re-added TokenStatusIndicator */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;