'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScreenerCalc, ScreenerColumn } from '@/lib/types';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'; // Import FileSpreadsheet icon
import { exportScreenerToXLSX } from '@/lib/xlsxExport'; // Import the new export function

interface StockScreenerTableProps {
  templateId: string;
  title: string;
}

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (numStr: string): string => {
  const num = parseFloat(numStr);
  if (isNaN(num)) return numStr; // Return original string if not a valid number

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000) return `${sign}${(absNum / 1_000_000_000).toFixed(2)}B`;
  if (absNum >= 1_000_000) return `${sign}${(absNum / 1_000_000).toFixed(2)}M`;
  if (absNum >= 1_000) return `${sign}${(absNum / 1_000).toFixed(2)}K`;
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

type SortColumnId = number | 'symbol'; // 'symbol' for the company symbol, number for column IDs
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumnId | null;
  direction: SortDirection;
}

export default function StockScreenerTable({ templateId, title }: StockScreenerTableProps) {
  const [screenerData, setScreenerData] = useState<ScreenerCalc[]>([]);
  const [columns, setColumns] = useState<ScreenerColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(31); // Changed from 25 to 31
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' }); // Default sort config
  const router = useRouter();

  useEffect(() => {
    const fetchScreenerData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stock-screener?templateId=${templateId}&page=${currentPage}&limit=${perPage}`);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch ${title}`);
        }
        setScreenerData(json.data);
        setColumns(json.columns);
        setTotalRows(json.totalRows);
        setCurrentPage(json.currentPage);
        setPerPage(json.perPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching ${title}`);
      } finally {
        setLoading(false);
      }
    };

    fetchScreenerData();
  }, [templateId, currentPage, perPage, title]);

  const handleSort = (columnId: SortColumnId) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.column === columnId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column: columnId, direction });
  };

  const getSortIndicator = (columnId: SortColumnId) => {
    if (sortConfig.column === columnId) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const sortedScreenerData = [...screenerData].sort((a, b) => {
    if (sortConfig.column === null) return 0;

    let aValue: any;
    let bValue: any;

    if (sortConfig.column === 'symbol') {
      aValue = a.company.symbol;
      bValue = b.company.symbol;
    } else {
      const aItem = a.results.find(res => res.id === sortConfig.column);
      const bItem = b.results.find(res => res.id === sortConfig.column);
      aValue = aItem ? parseFloat(aItem.raw) : -Infinity; // Use raw for numeric sort
      bValue = bItem ? parseFloat(bItem.raw) : -Infinity;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
  });

  const handleSymbolClick = (symbol: string) => {
    router.push(`/?symbol=${symbol}`); // Navigate to the main analysis page
  };

  const totalPages = Math.ceil(totalRows / perPage);

  const handleExport = () => {
    exportScreenerToXLSX(screenerData, columns, title);
  };

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          {title} ({totalRows} Saham)
        </h3>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)', // Green gradient for XLSX
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          disabled={screenerData.length === 0}
        >
          <FileSpreadsheet size={16} /> Export XLSX
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
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {getSortIndicator('symbol')}
                  </th>
                  {columns.map(col => (
                    <th
                      key={col.id}
                      style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.name} {getSortIndicator(col.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedScreenerData.map((item, index) => (
                  <tr key={item.company.symbol} style={{ borderBottom: index < sortedScreenerData.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td
                      style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)', cursor: 'pointer' }}
                      onClick={() => handleSymbolClick(item.company.symbol)}
                    >
                      {item.company.symbol}
                    </td>
                    {columns.map(col => {
                      const resultItem = item.results.find(res => res.id === col.id);
                      const value = resultItem ? resultItem.display : '-';
                      const rawValue = resultItem ? parseFloat(resultItem.raw) : NaN;

                      let textColor = 'var(--text-primary)';
                      if (col.name.includes('Buy') || col.name.includes('Flow')) {
                        if (!isNaN(rawValue)) {
                          textColor = rawValue >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)';
                        }
                      } else if (col.name === 'Price') {
                        // No specific coloring for price unless change is also shown
                      }

                      return (
                        <td key={`${item.company.symbol}-${col.id}`} style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: textColor }}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              className="btn"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem'
              }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Page {currentPage} of {totalPages}</span>
            <button
              className="btn"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem'
              }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}