'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { IdxSectorMemberStock } from '@/lib/types';
import { ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react';

const formatNumber = (num: number | undefined, decimals: number = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return num.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatCompactNumber = (num: number | undefined): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (absNum >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (absNum >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('id-ID');
};

export default function IdxSectorMembersPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const [stocks, setStocks] = useState<IdxSectorMemberStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchSectorMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/idx-sector-members/${symbol}`);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch members for ${symbol}`);
        }
        setStocks(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching members for ${symbol}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorMembers();
  }, [symbol]);

  const handleStockClick = (stockSymbol: string) => {
    router.push(`/?symbol=${stockSymbol}`);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading stocks for {symbol.toUpperCase()}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', textAlign: 'center', color: 'var(--accent-warning)' }}>
        <p>❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} className="btn btn-secondary compact-btn" style={{ padding: '0.5rem 1rem' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h2 style={{ margin: 0 }}>Saham Anggota {symbol.toUpperCase()}</h2>
      </div>

      {stocks.length === 0 ? (
        <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Tidak ada saham anggota yang ditemukan untuk indeks {symbol.toUpperCase()}.
        </div>
      ) : (
        <div className="glass-card-static" style={{ padding: '1rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Simbol</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Nama Perusahaan</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Harga Terakhir</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Perubahan</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>% Perubahan</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Volume</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, i) => {
                  const isPositive = stock.change_percentage >= 0;
                  const changeColor = isPositive ? 'var(--accent-success)' : 'var(--accent-warning)';
                  return (
                    <tr 
                      key={stock.symbol} 
                      style={{ borderBottom: i < stocks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', cursor: 'pointer' }}
                      onClick={() => handleStockClick(stock.symbol)}
                    >
                      <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {stock.symbol}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-primary)' }}>{stock.name}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatNumber(stock.last_price, 0)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: changeColor }}>
                        {isPositive ? '+' : ''}{formatNumber(stock.change_point, 2)}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: changeColor }}>
                        {isPositive ? '+' : ''}{formatNumber(stock.change_percentage, 2)}%
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(stock.volume)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(stock.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}