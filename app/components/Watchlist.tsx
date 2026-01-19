"use client";

import { useEffect, useState } from "react";
import type { WatchlistItem } from "@/lib/types";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch("/api/watchlist");
        const json = await response.json();
        if (!json.success) {
          throw new Error(json.error || "Failed to fetch watchlist");
        }
        const payload = json.data;
        const data = payload?.data?.result || payload?.data || [];
        setWatchlist(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, []);

  if (loading) return <div className="watchlist-loading">Loading watchlist...</div>;
  if (error) return <div className="watchlist-error">Error: {error}</div>;
  if (watchlist.length === 0) return <div className="watchlist-empty">No watchlist items found</div>;

  return (
    <div className="watchlist-container" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>All Watchlist</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
      }}>
        {watchlist.map((item, idx) => (
          <div
            key={idx}
            className="watchlist-card"
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '1rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 120,
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {item.symbol || item.company_code}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.5rem 0' }}>
                {item.sector || item.company_name}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Price</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Rp {item.formatted_price || item.last_price?.toLocaleString() || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Change</div>
                <div style={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: (parseFloat(item.percent) || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)'
                }}>
                  {(parseFloat(item.percent) || 0) >= 0 ? '+' : ''}{item.percent}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
