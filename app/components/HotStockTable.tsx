'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MarketMoverItem } from '@/lib/types';

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString();
};

type SortColumn = 'last_price' | 'value' | 'volume' | 'frequency' | 'change_percentage';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

export default function HotStockTable() {
  const [movers, setMovers] = useState<MarketMoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'change_percentage', direction: 'desc' });
  const router = useRouter();

  useEffect(() => {
    const fetchMovers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Top Gainer data
        const res = await fetch(`/api/market-movers?type=gainer&limit=50`);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch Hot Stocks`);
        }
        setMovers(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching Hot Stocks`);
      } finally {
        setLoading(false);
      }
    };

    fetchMovers();
  }, []);

  const handleSort = (column: SortColumn) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const sortedMovers = [...movers].sort((a, b) => {
    if (sortConfig.column === null) return 0;

    const aValue = a[sortConfig.column] || 0;
    const bValue = b[sortConfig.column] || 0;

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIndicator = (column: SortColumn) => {
    if (sortConfig.column === column) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const handleSymbolClick = (symbol: string) => {
    router.push(`/?symbol=${symbol}`); // Navigate to the main analysis page
  };

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
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
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('last_price')}
                >
                  Price {getSortIndicator('last_price')}
                </th>
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('change_percentage')}
                >
                  Change (%) {getSortIndicator('change_percentage')}
                </th>
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('value')}
                >
                  Value {getSortIndicator('value')}
                </th>
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('volume')}
                >
                  Volume {getSortIndicator('volume')}
                </th>
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('frequency')}
                >
                  Freq {getSortIndicator('frequency')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMovers.map((item, index) => (
                <tr key={item.symbol} style={{ borderBottom: index < sortedMovers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <td 
                    style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
                    onClick={() => handleSymbolClick(item.symbol)}
                  >
                    {item.symbol}
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                    {item.last_price.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                    <span style={{ color: item.change_percentage >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                      {item.change_percentage >= 0 ? '+' : ''}{item.change_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.value)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.volume)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(item.frequency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}