'use client';

import { useState, useEffect, useRef } from 'react';

type TokenStatusData = {
  exists: boolean;
  isValid: boolean;
  token?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  updatedAt?: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
  hoursUntilExpiry?: number;
};

export default function TokenStatusIndicator() {
  const [status, setStatus] = useState<TokenStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIsValidRef = useRef<boolean | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/token-status');
        if (res.ok) {
          const data: TokenStatusData = await res.json();

          // Check for transition from invalid/none to valid
          if (data.isValid && prevIsValidRef.current === false) {
            console.log('Token became valid, dispatching refresh event');
            window.dispatchEvent(new CustomEvent('token-refreshed'));
          }

          prevIsValidRef.current = data.isValid;
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch token status', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Dynamic interval: poll faster if token is invalid
    const getInterval = () => {
      if (!status) return 30000;
      const isError = !status.exists || !status.isValid || status.isExpired;
      return isError ? 5000 : 30000; // 5s if error, 30s otherwise
    };

    const intervalId = setInterval(fetchStatus, getInterval());

    return () => clearInterval(intervalId);
  }, [status?.isValid]);

  if (loading || !status) return null;

  const isGood = status.exists && status.isValid && !status.isExpired && !status.isExpiringSoon;
  const isWarning = status.exists && status.isValid && status.isExpiringSoon && !status.isExpired;
  const isError = !status.exists || !status.isValid || status.isExpired;

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors bg-secondary hover:bg-white/[0.1]"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-accent-warning' : isWarning ? 'bg-yellow-500' : 'bg-accent-success'}`} />
        <span className={`text-xs font-medium whitespace-nowrap ${isError ? 'text-accent-warning' : isWarning ? 'text-yellow-500' : 'text-accent-success'}`}>
          {isError ? 'Token Invalid' : isWarning ? 'Token Expiring' : 'Stockbit Connected'}
        </span>
      </div>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-64 p-4 bg-card border border-border-color rounded-xl shadow-lg animate-slideIn z-50">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-color">
            <span className="text-sm font-semibold text-text-primary">Stockbit Link</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isError ? 'bg-accent-warning' : isWarning ? 'bg-yellow-500' : 'bg-accent-success'}`} />
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-text-secondary">Status:</span>
            <span className={`${isError ? 'text-accent-warning' : 'text-accent-success'} font-medium`}>
              {isError ? 'Disconnected' : 'Connected'}
            </span>
          </div>

          {status.lastUsedAt && (
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-text-secondary">Last Used:</span>
              <span className="text-text-primary text-sm">
                {new Date(status.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {status.expiresAt && (
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-text-secondary">Expires:</span>
              <span className={`text-sm ${isWarning ? 'text-yellow-500' : 'text-text-primary'}`}>
                {new Date(status.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border-color">
            <p className="text-xs text-text-muted leading-tight mb-3">
              {isError
                ? 'Token has expired or is invalid. Please login to Stockbit via the extension to refresh.'
                : 'Connection is active. Token will be automatically refreshed by the extension.'}
            </p>
            <a
              href="https://stockbit.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isError ? 'Login to Stockbit' : 'Open Stockbit'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}