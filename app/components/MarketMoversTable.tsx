'use client';

import { useState, useEffect } from 'react';
import type { MarketMoverItem, MarketMoverType, TradeBookTotal } from '@/lib/types';

interface MarketMoversTableProps {
  type: MarketMoverType;
  title: string;
  limit?: number;
}

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (num: number | null | undefined): string => {
  if (num === undefined || num === null || num === 0) return '-'; // Menampilkan '-' untuk 0
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (absNum >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (absNum >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString();
};

// Helper to parse string numbers from trade book
const parseTradeBookNumber = (numStr: string | undefined): number | null => {
  if (!numStr || numStr === '-') return null;
  return parseFloat(numStr.replace(/,/g, ''));
};

// Helper to format percentage string
const formatPercentage = (percentStr: string | undefined): string => {
  if (!percentStr || percentStr === '-') return '-';
  return percentStr; // Already includes '%'
};

type SortColumn = 'last_price' | 'value' | 'volume' | 'frequency' | 'net_foreign_buy';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

export default function MarketMoversTable({ type, title, limit = 10 }: MarketMoversTableProps) {
  const [movers, setMovers] = useState<MarketMoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });

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
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('last_price')}
                >
                  Price {getSortIndicator('last_price')}
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
                <th 
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('net_foreign_buy')}
                >
                  Net Foreign {getSortIndicator('net_foreign_buy')}
                </th>
                {/* New Headers */}
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Buy Lot</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Sell Lot</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Total Lot</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Buy Freq</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Sell Freq</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Total Freq</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Buy %</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Sell %</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovers.map((item, index) => (
                <tr key={item.symbol} style={{ borderBottom: index < sortedMovers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
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
                  {/* New Data Cells */}
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.buy_lot))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.sell_lot))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.total_lot))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.buy_frequency))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.sell_frequency))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseTradeBookNumber(item.tradeBookData?.total_frequency))}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatPercentage(item.tradeBookData?.buy_percentage)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatPercentage(item.tradeBookData?.sell_percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}