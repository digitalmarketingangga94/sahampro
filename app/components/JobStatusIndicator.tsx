'use client';

import { useState, useEffect, useRef } from 'react';
import type { BackgroundJobLog } from '@/lib/types';

export default function JobStatusIndicator() {
  const [latestLog, setLatestLog] = useState<BackgroundJobLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/job-logs?limit=1');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setLatestLog(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch job status', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30000); // 30s
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!latestLog) return null;

  const isRunning = latestLog.status === 'running';
  const isFailed = latestLog.status === 'failed';
  const isCompleted = latestLog.status === 'completed';

  const statusClass = isRunning ? 'bg-yellow-500' : isFailed ? 'bg-accent-warning' : 'bg-accent-success';
  const statusLabel = isRunning ? 'Job Running' : isFailed ? 'Job Failed' : 'Jobs Idle';

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors bg-secondary hover:bg-white/[0.1]"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${statusClass}`} />
        <span className={`text-xs font-medium whitespace-nowrap ${isFailed ? 'text-accent-warning' : isRunning ? 'text-yellow-500' : 'text-accent-success'}`}>
          {statusLabel}
        </span>
      </div>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 p-4 bg-card border border-border-color rounded-xl shadow-lg animate-slideIn z-50">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-color">
            <span className="text-sm font-semibold text-text-primary">Latest Job Run</span>
            <div className={`w-2.5 h-2.5 rounded-full ${statusClass}`} />
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-text-secondary">Job:</span>
            <span className="text-text-primary">{latestLog.job_name}</span>
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-text-secondary">Started:</span>
            <span className="text-text-primary">
              {new Date(latestLog.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-text-secondary">Stats:</span>
            <span className="text-text-primary">
              <span className="text-accent-success">✓{latestLog.success_count}</span>
              {latestLog.error_count > 0 && (
                <span className="text-accent-warning ml-2">✕{latestLog.error_count}</span>
              )}
            </span>
          </div>

          {latestLog.status === 'failed' && latestLog.error_message && (
            <div className="mt-3 p-2 bg-accent-warning/[0.1] border border-accent-warning/[0.3] rounded-md text-accent-warning text-xs flex items-start gap-2">
              <span className="text-base">⚠</span>
              {latestLog.error_message}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border-color">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Recent logs
            </div>
            <div 
              className="max-h-[150px] overflow-y-auto text-xs font-mono custom-scrollbar"
              ref={scrollRef}
            >
              {latestLog.log_entries && latestLog.log_entries.length > 0 ? (
                latestLog.log_entries.slice(-5).map((entry, idx) => (
                  <div key={idx} className={`flex items-baseline gap-1 ${entry.level === 'error' ? 'text-accent-warning' : entry.level === 'warn' ? 'text-yellow-500' : 'text-text-secondary'}`}>
                    <span className="flex-shrink-0">[{entry.emiten || 'SYS'}]</span>
                    <span className="flex-grow">{entry.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted text-center p-4">
                  No logs available
                </div>
              )}
            </div>
          </div>

          <button 
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium rounded-lg transition-colors mt-4"
            onClick={() => window.open('/history', '_self')}
          >
            Go to History
          </button>
        </div>
      )}
    </div>
  );
}