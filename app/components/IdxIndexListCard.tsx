'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { EmitenInfoResponse, IdxSubsectorItem } from '@/lib/types'; // Import IdxSubsectorItem
import { fetchIdxSectorInfo } from '@/lib/stockbit';

export default function IdxIndexListCard() {
  const [idxIndices, setIdxIndices] = useState<IdxSubsectorItem[]>([]); // State to store fetched indices
  const [indexData, setIndexData] = useState<Record<string, EmitenInfoResponse['data']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllIndexData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch subsectors from the new API route
        const subsectorsResponse = await fetch('/api/idx-subsectors');
        const subsectorsJson = await subsectorsResponse.json();

        if (!subsectorsJson.success) {
          throw new Error(subsectorsJson.error || 'Failed to fetch IDX subsectors');
        }

        const fetchedSubsectors: IdxSubsectorItem[] = subsectorsJson.data || [];
        setIdxIndices(fetchedSubsectors); // Set the fetched subsectors as indices

        // Now, for each fetched subsector, fetch its detailed info
        const promises = fetchedSubsectors.map(async (index) => {
          try {
            const response = await fetchIdxSectorInfo(index.name); // Use index.name as symbol
            return { symbol: index.name, data: response.data };
          } catch (err) {
            console.error(`Failed to fetch data for ${index.name}:`, err);
            return { symbol: index.name, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
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
                const data = indexData[index.name]; // Use index.name to lookup data
                const isPositive = data && data.percentage >= 0;
                const changeColor = isPositive ? 'var(--accent-success)' : 'var(--accent-warning)';

                return (
                  <tr key={index.id} style={{ borderBottom: i < idxIndices.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      <Link href={`/idx-sector/${index.name}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                        {index.name}
                      </Link>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-primary)' }}>{data?.name || index.name}</td> {/* Use data.name if available, else index.name */}
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