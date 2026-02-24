'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TopStockItem } from '@/lib/types';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils'; // Import getDateNDaysAgo
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

type TopStockType = 'top_buy' | 'top_sell';
type SortColumn = 'value' | 'lot' | 'average' | 'foreign_value' | 'frequency';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

// Helper to format raw string numbers from API (e.g., "85395521200" -> "85.4B")
const formatRawValue = (valueStr: string | undefined): string => {
  if (!valueStr) return '-';
  const num = parseFloat(valueStr);
  if (isNaN(num)) return '-';
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (absNum >= 1_000_000) return `${(absNum / 1_000_000).toFixed(1)}M`;
  if (absNum >= 1_000) return `${(absNum / 1_000).toFixed(1)}K`;
  return num.toLocaleString('id-ID');
};

export default function TopStockTable() {
  const [topBuyData, setTopBuyData] = useState<TopStockItem[]>([]);
  const [topSellData, setTopSellData] = useState<TopStockItem[]>([]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TopStockType>('top_buy');
  
  // Set default dates to the previous day
  const defaultPreviousDay = getDateNDaysAgo(1);
  const [startDate, setStartDate] = useState(defaultPreviousDay);
  const [endDate, setEndDate] = useState(defaultPreviousDay);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'value', direction: 'desc' });
  const router = useRouter();

  useEffect(() => {
    const fetchTopStocksData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/top-stock?startDate=${startDate}&endDate=${endDate}`);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch Top Stocks`);
        }
        setTopBuyData(json.data.top_buy || []);
        setTopSellData(json.data.top_sell || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching Top Stocks`);
      } finally {
        setLoading(false);
      }
    };

    fetchTopStocksData();
  }, [startDate, endDate]);

  const handleSort = (column: SortColumn) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const sortedData = [...(activeTab === 'top_buy' ? topBuyData : topSellData)].sort((a, b) => {
    if (sortConfig.column === null) return 0;

    const aValue = parseFloat(a[sortConfig.column]?.raw || '0');
    const bValue = parseFloat(b[sortConfig.column]?.raw || '0');

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Top Stock ({activeTab === 'top_buy' ? 'Buy' : 'Sell'})
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="date-range-group" style={{ height: '32px', borderRadius: '8px' }}>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="date-separator" style={{ margin: '0 1px', padding: 0 }}>→</span>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs for Top Buy / Top Sell */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
        <button
          className={`broker-flow-filter-btn ${activeTab === 'top_buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('top_buy')}
          style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px' }}
        >
          Top Buy ({topBuyData.length})
        </button>
        <button
          className={`broker-flow-filter-btn ${activeTab === 'top_sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('top_sell')}
          style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px' }}
        >
          Top Sell ({topSellData.length})
        </button>
      </div>

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
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Rank</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Code</th>
                <th
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('value')}
                >
                  Value {getSortIndicator('value')}
                </th>
                <th
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('lot')}
                >
                  Lot {getSortIndicator('lot')}
                </th>
                <th
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('average')}
                >
                  Avg {getSortIndicator('average')}
                </th>
                <th
                  style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => handleSort('foreign_value')}
                >
                  N.Foreign {getSortIndicator('foreign_value')}
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
              {sortedData.map((item, index) => (
                <tr key={item.code} style={{ borderBottom: index < sortedData.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)' }}>{item.rank}</td>
                  <td
                    style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
                    onClick={() => handleSymbolClick(item.code)}
                  >
                    {item.code}
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatRawValue(item.value.raw)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatRawValue(item.lot.raw)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatRawValue(item.average.raw)}</td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: parseFloat(item.foreign_value.raw) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                    {formatRawValue(item.foreign_value.raw)}
                  </td>
                  <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatRawValue(item.frequency.raw)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}