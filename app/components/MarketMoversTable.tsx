'use client';

import { useState, useEffect } from 'react';
import type { MarketMoverItem, MarketMoverType } from '@/lib/types';

interface MarketMoversTableProps {
  type: MarketMoverType;
  title: string;
  limit?: number;
}

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString();
};

export default function MarketMoversTable({ type, title, limit = 10 }: MarketMoversTableProps) {
  const [movers, setMovers] = useState<MarketMoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/market-movers?type=${type}&limit=${limit}`);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch ${title}`);
        }
        setMovers(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching ${title}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMovers();
  }, [type, limit, title]);

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>{title}</h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Symbol</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Price</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Value</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Volume</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Freq</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Net Foreign</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((item, index) => (
                <tr key={item.symbol} style={{ borderBottom: index < movers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{item.symbol}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                    {item.last_price.toLocaleString()}
                    <span style={{ color: item.change_percentage >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)', marginLeft: '0.5rem' }}>
                      ({item.change_percentage >= 0 ? '+' : ''}{item.change_percentage.toFixed(2)}%)
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.value)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.volume)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.frequency)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: item.net_foreign_buy && item.net_foreign_buy >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                    {item.net_foreign_buy ? formatCompactNumber(item.net_foreign_buy) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}