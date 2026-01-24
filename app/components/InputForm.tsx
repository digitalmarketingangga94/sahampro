'use client';

import { useState, useEffect } from 'react';
import type { StockInput } from '@/lib/types';
import { getLatestTradingDate } from '@/lib/utils';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: StockInput) => void;
  loading: boolean;
  initialEmiten?: string | null; // Reverted type
  fromDate: string;
  toDate: string;
  onDateChange: (fromDate: string, toDate: string) => void;
  // Action Button Props
  onCopyText?: () => void;
  onCopyImage?: () => void;
  onAnalyzeAI?: () => void;
  copiedText?: boolean;
  copiedImage?: boolean;
  storyStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  hasResult?: boolean;
}

export default function InputForm({
  onSubmit,
  loading,
  initialEmiten,
  fromDate,
  toDate,
  onDateChange,
  onCopyText,
  onCopyImage,
  onAnalyzeAI,
  copiedText,
  copiedImage,
  storyStatus,
  hasResult
}: InputFormProps) {
  const [emiten, setEmiten] = useState(initialEmiten || ''); // Reverted default state
  const [currentFlag, setCurrentFlag] = useState<'OK' | 'NG' | 'Neutral' | null>(null);

  useEffect(() => {
    // Only update if initialEmiten is explicitly provided (can be empty string)
    // and it's different from the current internal state to avoid unnecessary re-renders
    if (initialEmiten !== undefined && initialEmiten !== null && initialEmiten.toUpperCase() !== emiten.toUpperCase()) {
      setEmiten(initialEmiten.toUpperCase());
    }
  }, [initialEmiten]); // Reverted dependencies

  // Fetch current flag when emiten changes
  useEffect(() => {
    const fetchFlag = async () => {
      if (!emiten) {
        setCurrentFlag(null);
        return;
      }
      try {
        const res = await fetch(`/api/emiten/flag?emiten=${emiten}`);
        const json = await res.json();
        if (json.success) {
          setCurrentFlag(json.flag);
        }
      } catch (err) {
        console.error('Error fetching flag:', err);
      }
    };
    fetchFlag();
  }, [emiten]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ emiten, fromDate, toDate });
  };

  const setDateRange = (value: number, unit: 'days' | 'months') => {
    const end = new Date();
    const start = new Date();

    if (unit === 'days') {
      start.setDate(end.getDate() - value + 1); // +1 to include the current day in the range
    } else if (unit === 'months') {
      start.setMonth(end.getMonth() - value);
      // Adjust day if it goes past the end of the month (e.g., Jan 31 - 1 month = Feb 31 -> Feb 28)
      if (start.getDate() !== end.getDate()) {
        start.setDate(0); // Set to last day of previous month
      }
    }

    // Format YYYY-MM-DD
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    onDateChange(formatDate(start), formatDate(end));
  };

  const handleFlag = async (flag: 'OK' | 'NG' | 'Neutral') => {
    if (!emiten) return;
    try {
      const res = await fetch('/api/emiten/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emiten, flag }),
      });
      if (res.ok) {
        setCurrentFlag(flag);
        // Dispatch custom event to notify other components (like WatchlistSidebar)
        window.dispatchEvent(new CustomEvent('emiten-flagged', {
          detail: { emiten, flag }
        }));
      }
    } catch (err) {
      console.error('Error flagging emiten:', err);
    }
  };

  return (
    <div className="glass-card-static compact-form">
      <form onSubmit={handleSubmit}>
        <div className="compact-form-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Analyze Stock</h3>
          </div>
          <div className="quick-dates">
            <button type="button" onClick={() => setDateRange(1, 'days')} className="quick-date-btn">1D</button>
            <button type="button" onClick={() => setDateRange(7, 'days')} className="quick-date-btn">7D</button>
            <button type="button" onClick={() => setDateRange(14, 'days')} className="quick-date-btn">14D</button>
            <button type="button" onClick={() => setDateRange(1, 'months')} className="quick-date-btn">1M</button>
            <button type="button" onClick={() => setDateRange(2, 'months')} className="quick-date-btn">2M</button>
            <button type="button" onClick={() => setDateRange(3, 'months')} className="quick-date-btn">3M</button>
            <button type="button" onClick={() => setDateRange(6, 'months')} className="quick-date-btn">6M</button>
            <button type="button" onClick={() => setDateRange(12, 'months')} className="quick-date-btn">1Y</button>
          </div>
        </div>

        <div className="compact-form-row">
          <div className="input-group compact-group" style={{ flex: '1 1 140px', minWidth: '120px' }}>
            <label htmlFor="emiten" className="input-label compact-label">
              Emiten
            </label>
            <div className="input-field compact-input emiten-focus-wrapper" style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 0.5rem',
              gap: '0.2rem',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}>
              <input
                id="emiten"
                type="text"
                value={emiten}
                onChange={(e) => setEmiten(e.target.value.toUpperCase())}
                onFocus={(e) => e.currentTarget.parentElement?.style.setProperty('border-color', 'var(--accent-primary)')}
                onBlur={(e) => e.currentTarget.parentElement?.style.setProperty('border-color', 'var(--border-color)')}
                placeholder="CODE"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '4px 0',
                  color: 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  width: '100%',
                  letterSpacing: '0.5px'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', opacity: currentFlag ? 1 : 0, transition: 'opacity 0.2s' }}>
                {currentFlag === 'OK' && <CheckCircle2 size={13} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />}
                {currentFlag === 'NG' && <XCircle size={13} color="#f97316" fill="rgba(249, 115, 22, 0.2)" />}
                {currentFlag === 'Neutral' && <MinusCircle size={13} color="var(--text-secondary)" />}
              </div>
            </div>
          </div>

          <div className="input-group compact-group" style={{ flex: '1 1 210px', minWidth: '200px' }}>
            <label className="input-label compact-label">
              Date Range
            </label>
            <div className="date-range-group" style={{ height: '38px', borderRadius: '12px' }}>
              <input
                id="fromDate"
                type="date"
                className="input-field compact-input"
                style={{ padding: '0', fontSize: '0.75rem', width: '95px', textAlign: 'center' }}
                value={fromDate}
                onChange={(e) => onDateChange(e.target.value, toDate)}
                required
              />
              <span className="date-separator" style={{ margin: '0 1px', padding: 0 }}>→</span>
              <input
                id="toDate"
                type="date"
                className="input-field compact-input"
                style={{ padding: '0', fontSize: '0.75rem', width: '95px', textAlign: 'center' }}
                value={toDate}
                onChange={(e) => onDateChange(fromDate, e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary compact-btn"
              disabled={loading}
              style={{
                minWidth: '100px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              {loading ? '...' : 'Analyze'}
            </button>

            <button
              type="button"
              onClick={onAnalyzeAI}
              disabled={storyStatus === 'pending' || storyStatus === 'processing' || !hasResult}
              className="btn btn-primary compact-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0 1rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #6C63FF, #00C896)',
                border: 'none',
                opacity: hasResult ? 1 : 0.5,
                pointerEvents: hasResult ? 'auto' : 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(108, 99, 255, 0.2)'
              }}
            >
              {storyStatus === 'pending' || storyStatus === 'processing' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⏳ Analyzing...
                </span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                  </svg>
                  Analyze Story
                </>
              )}
            </button>
          </div>

          {/* Flagging Buttons */}
          <div className="flag-container" style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleFlag('OK')}
              className={`btn compact-btn ${currentFlag === 'OK' ? 'active' : ''}`}
              title="Mark as OK"
              style={{
                padding: '0.4rem',
                background: currentFlag === 'OK' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.05)',
                color: '#3b82f6',
                border: `1px solid ${currentFlag === 'OK' ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)'}`,
                boxShadow: currentFlag === 'OK' ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <CheckCircle2 size={16} fill={currentFlag === 'OK' ? 'rgba(59, 130, 246, 0.4)' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => handleFlag('NG')}
              className={`btn compact-btn ${currentFlag === 'NG' ? 'active' : ''}`}
              title="Mark as NG"
              style={{
                padding: '0.4rem',
                background: currentFlag === 'NG' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.05)',
                color: '#f97316',
                border: `1px solid ${currentFlag === 'NG' ? '#f97316' : 'rgba(249, 115, 22, 0.2)'}`,
                boxShadow: currentFlag === 'NG' ? '0 0 10px rgba(249, 115, 22, 0.3)' : 'none'
              }}
            >
              <XCircle size={16} fill={currentFlag === 'NG' ? 'rgba(249, 115, 22, 0.4)' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => handleFlag('Neutral')}
              className={`btn compact-btn ${currentFlag === 'Neutral' ? 'active' : ''}`}
              title="Mark as Neutral"
              style={{
                padding: '0.4rem',
                background: currentFlag === 'Neutral' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                border: `1px solid ${currentFlag === 'Neutral' ? 'rgba(255,255,255,0.4)' : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              <MinusCircle size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}