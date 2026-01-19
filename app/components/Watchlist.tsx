"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WatchlistItem } from "@/lib/types";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <div className="spinner" style={{
        width: 48, height: 48, border: '5px solid #eee', borderTop: '5px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 18
      }} />
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Memuat Watchlist...</div>
    </div>
  );
  if (error) return <div className="watchlist-error">Error: {error}</div>;
  if (watchlist.length === 0) return <div className="watchlist-empty">No watchlist items found</div>;

  return (
    <div className="watchlist-container" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '2.2rem', letterSpacing: '-1px', color: '#222' }}>All Watchlist</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
      }}>
        {watchlist.map((item, idx) => (
          <div
            key={idx}
            className="watchlist-card"
            tabIndex={0}
            role="button"
            onClick={() => router.push(`/?stock=${item.symbol || item.company_code}`)}
            onKeyDown={e => { if (e.key === 'Enter') router.push(`/?stock=${item.symbol || item.company_code}`); }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: '1rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 120,
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'box-shadow 0.18s, transform 0.18s',
              outline: 'none',
              border: '1.5px solid #f3f3f3',
            }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,112,243,0.10)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)')}
            onFocus={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,112,243,0.10)')}
            onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)')}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a237e', letterSpacing: '-0.5px' }}>
                {item.symbol || item.company_code}
              </div>
              <div style={{ fontSize: '1.02rem', color: '#444', margin: '0.25rem 0 0.5rem 0', fontWeight: 500 }}>
                {item.sector || item.company_name}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>Price</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#222' }}>
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
