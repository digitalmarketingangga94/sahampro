'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import type { TradeBookTotal, TradeBookCombinedData } from '@/lib/types';

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '-';
  const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(n)) return '-';

  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toLocaleString();
};

interface TradeBookDisplayProps {
  initialEmiten?: string;
}

export default function TradeBookDisplay({ initialEmiten }: TradeBookDisplayProps) {
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const [emiten, setEmiten] = useState(initialEmiten || '');
  const [tradeBookCombinedData, setTradeBookCombinedData] = useState<TradeBookCombinedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle initial symbol from URL
  useEffect(() => {
    const symbolFromUrl = searchParams.get('symbol');
    if (symbolFromUrl && symbolFromUrl !== emiten) {
      setEmiten(symbolFromUrl.toUpperCase());
      // Trigger search automatically
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(syntheticEvent, symbolFromUrl.toUpperCase());
    } else if (!symbolFromUrl && !initialEmiten) {
      // Clear data if no symbol in URL and no initialEmiten
      setTradeBookCombinedData(null);
      setError(null);
    }
  }, [searchParams]); // Depend on searchParams to react to URL changes

  const handleSubmit = async (e: React.FormEvent, symbolOverride?: string) => {
    e.preventDefault();
    const currentEmiten = symbolOverride || emiten;

    if (!currentEmiten) {
      setError('Please enter a stock symbol.');
      return;
    }

    setLoading(true);
    setError(null);
    setTradeBookCombinedData(null);

    try {
      const response = await fetch(`/api/trade-book?symbol=${currentEmiten}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch trade book data.');
      }
      setTradeBookCombinedData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Removed console.log for debugging as requested

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="glass-card-static compact-form" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="compact-form-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Trade Book Analysis</h3>
            </div>
          </div>

          <div className="compact-form-row">
            <div className="input-group compact-group" style={{ flex: '1 1 140px', minWidth: '120px' }}>
              <label htmlFor="emiten" className="input-label compact-label">
                Emiten
              </label>
              <input
                id="emiten"
                type="text"
                value={emiten}
                onChange={(e) => setEmiten(e.target.value.toUpperCase())}
                placeholder="CODE"
                required
                className="input-field compact-input"
                style={{
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}
              />
            </div>

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
              {loading ? '...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="text-secondary mt-2">Fetching trade book data...</p>
        </div>
      )}

      {error && (
        <div className="glass-card mt-4" style={{
          background: 'rgba(245, 87, 108, 0.1)',
          borderColor: 'var(--accent-warning)'
        }}>
          <h3>❌ Error</h3>
          <p style={{ color: 'var(--accent-warning)' }}>{error}</p>
        </div>
      )}

      {tradeBookCombinedData && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Trade Book Summary for {emiten.toUpperCase()}
          </h3>

          {/* Display Price, Percentage Change, Volume, Value */}
          <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {tradeBookCombinedData.marketData.price.toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change %</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem', color: tradeBookCombinedData.marketData.change_percentage >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                {tradeBookCombinedData.marketData.change_percentage >= 0 ? '+' : ''}{tradeBookCombinedData.marketData.change_percentage.toFixed(2)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {formatCompactNumber(tradeBookCombinedData.marketData.volume)}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {formatCompactNumber(tradeBookCombinedData.marketData.value)}
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Metric</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Buy</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Sell</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Lot',
                    buy: tradeBookCombinedData.tradeBookTotal.buy_lot,
                    sell: tradeBookCombinedData.tradeBookTotal.sell_lot,
                    total: tradeBookCombinedData.tradeBookTotal.total_lot,
                    isPercentage: false,
                  },
                  {
                    label: 'Frequency',
                    buy: tradeBookCombinedData.tradeBookTotal.buy_frequency,
                    sell: tradeBookCombinedData.tradeBookTotal.sell_frequency,
                    total: tradeBookCombinedData.tradeBookTotal.total_frequency,
                    isPercentage: false,
                  },
                  {
                    label: 'Percentage',
                    buy: tradeBookCombinedData.tradeBookTotal.buy_percentage,
                    sell: tradeBookCombinedData.tradeBookTotal.sell_percentage,
                    total: '-', // Total percentage not directly available
                    isPercentage: true,
                  },
                ].map((row, index) => (
                  <tr key={row.label} style={{ borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none'}}>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.isPercentage ? row.buy : formatCompactNumber(row.buy)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.isPercentage ? row.sell : formatCompactNumber(row.sell)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{row.isPercentage ? row.total : formatCompactNumber(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Removed: Trade Book List Table */}
        </div>
      )}
    </div>
  );
}