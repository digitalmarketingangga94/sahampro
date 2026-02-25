'use client';

import { useState, useEffect } from 'react';
import StockHeatmapGrid from '../components/StockHeatmapGrid';
import type { MarketMoverItem } from '@/lib/types';

export default function IdxSectorPage() {
  const [stocks, setStocks] = useState<MarketMoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketMoversData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gainersRes, losersRes] = await Promise.all([
          fetch('/api/market-movers?type=gainer&limit=50'),
          fetch('/api/market-movers?type=loser&limit=50'),
        ]);

        const gainersJson = await gainersRes.json();
        const losersJson = await losersRes.json();

        if (!gainersJson.success || !losersJson.success) {
          throw new Error(gainersJson.error || losersJson.error || 'Failed to fetch market movers');
        }

        const combinedStocks = [
          ...(gainersJson.data || []),
          ...(losersJson.data || []),
        ];

        // Sort by change_percentage descending to show gainers first, then losers
        combinedStocks.sort((a, b) => b.change_percentage - a.change_percentage);

        setStocks(combinedStocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching market movers');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMoversData();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🔥 Market Heatmap</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <StockHeatmapGrid stocks={stocks} />
      )}
    </div>
  );
}