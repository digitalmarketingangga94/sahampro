'use client';

import { useState, useEffect } from 'react';
import StockHeatmapGrid from '../components/StockHeatmapGrid'; // Import the new grid component
import type { MarketMoverItem } from '@/lib/types';

export default function HotStockPage() {
  const [movers, setMovers] = useState<MarketMoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🔥 Hot Stock (Top Gainer)</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <StockHeatmapGrid stocks={movers} />
      )}
    </div>
  );
}