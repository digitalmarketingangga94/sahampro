'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { EmitenInfoResponse } from '@/lib/types';
import { fetchIdxSectorInfo } from '@/lib/stockbit';

export default function IdxIndexListCard() {
  const idxIndices = [
    { symbol: 'IDXQ30', name: 'IDX Quality30' },
    { symbol: 'IDXBUMN20', name: 'IDX BUMN20' },
    { symbol: 'IDXINFRA', name: 'IDX Sector Infrastructures' },
    { symbol: 'IDXFINANCE', name: 'IDX Sector Financials' },
    { symbol: 'IDXV30', name: 'IDX Value 30' },
    { symbol: 'IDXTRANS', name: 'IDX Transportation & Logistic' },
    { symbol: 'IDXSHAGROW', name: 'IDX Sharia Growth' },
    { symbol: 'IDXESGL', name: 'IDX ESG Leaders' },
    { symbol: 'IDXENERGY', name: 'IDX Sector Energy' },
    { symbol: 'IDXHEALTH', name: 'IDX Sector Healthcare' },
    { symbol: 'IDXINDUST', name: 'IDX Sector Industrials' },
    { symbol: 'IDXTECHNO', name: 'IDX Sector Technology' },
    { symbol: 'IDXG30', name: 'IDX Growth 30' },
    { symbol: 'IDXCICLIC', name: 'IDX Sector Consumer Cyclical' },
    { symbol: 'IDXBASIC', name: 'IDX Sector Basic Materials' },
    { symbol: 'IDXVESTA28', name: 'IDX Infovesta Multi-Factor 28' },
    { symbol: 'IDXSMC-COM', name: 'IDX Small-Mid Cap Composite' },
    { symbol: 'IDXNONCYC', name: 'IDX Sector Consumer Non-Cyclicals' },
    { symbol: 'IDXSMC-LIQ', name: 'IDX Small-Mid Cap Liquid' },
    { symbol: 'IDXPROPERT', name: 'IDX Sector Properties & Real Estate' },
  ];

  const [indexData, setIndexData] = useState<Record<string, EmitenInfoResponse['data']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllIndexData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = idxIndices.map(async (index) => {
          try {
            const response = await fetchIdxSectorInfo(index.symbol);
            return { symbol: index.symbol, data: response.data };
          } catch (err) {
            console.error(`Failed to fetch data for ${index.symbol}:`, err);
            return { symbol: index.symbol, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
          }
        });

        const results = await Promise.allSettled(promises);
        const newData: Record<string, EmitenInfoResponse['data']> = {};
        let hasError = false;

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.data) {
            newData[result.value.symbol] = result.value.data;
          } else if (result.status === 'fulfilled' && result.value.error) {
            hasError = true;
            console.error(`Error for ${result.value.symbol}: ${result.value.error}`);
          } else if (result.status === 'rejected') {
            hasError = true;
            console.error(`Promise rejected for an index: ${result.reason}`);
          }
        });

        setIndexData(newData);
        if (hasError) {
          setError('Some index data could not be loaded. Check console for details.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch all index data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllIndexData();
  }, []);

  const formatNumber = (num: number | string | undefined, decimals: number = 0): string => {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '-';
    return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
        Daftar Indeks IDX
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading index data...</p>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>#</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Simbol Indeks</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Nama Indeks</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Change</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Change %</th>
              </tr>
            </thead>
            <tbody>
              {idxIndices.map((index, i) => {
                const data = indexData[index.symbol];
                const isPositive = data && data.percentage >= 0;
                const changeColor = isPositive ? 'var(--accent-success)' : 'var(--accent-warning)';

                return (
                  <tr key={index.symbol} style={{ borderBottom: i < idxIndices.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      <Link href={`/idx-sector/${index.symbol}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                        {index.symbol}
                      </Link>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-primary)' }}>{index.name}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: changeColor }}>
                      {data ? `${isPositive ? '+' : ''}${formatNumber(data.change, 2)}` : '-'}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: changeColor }}>
                      {data ? `${isPositive ? '+' : ''}${formatNumber(data.percentage, 2)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}