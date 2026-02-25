'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { IdxSector, EmitenInfoResponse } from '@/lib/types';
import { fetchIdxSectorInfo, fetchSectors } from '@/lib/stockbit';
import IdxSectorGridCard from './IdxSectorGridCard'; // Import the new grid card component

export default function IdxIndexListCard() {
  const [idxIndices, setIdxIndices] = useState<IdxSector[]>([]);
  const [indexData, setIndexData] = useState<Record<string, EmitenInfoResponse['data']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // useRouter is not directly used here anymore for navigation, but kept if needed elsewhere
  // const router = useRouter(); 

  useEffect(() => {
    const fetchAllIndexData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedSectors: IdxSector[] = await fetchSectors();
        setIdxIndices(fetchedSectors);

        const promises = fetchedSectors.map(async (sector) => {
          try {
            const response = await fetchIdxSectorInfo(sector.name);
            return { symbol: sector.name, data: response.data };
          } catch (err) {
            console.error(`Failed to fetch data for ${sector.name}:`, err);
            return { symbol: sector.name, data: null, error: err instanceof Error ? err.message : 'Unknown error' };
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

  // Removed handleSectorClick as navigation is now handled by IdxSectorGridCard's Link

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
        Daftar Indeks IDX
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading index data...</p>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div className="idx-sector-grid"> {/* New grid container */}
          {idxIndices.map((sector) => (
            <IdxSectorGridCard 
              key={sector.id} 
              sector={sector} 
              data={indexData[sector.name] || null} 
            />
          ))}
        </div>
      )}
    </div>
  );
}