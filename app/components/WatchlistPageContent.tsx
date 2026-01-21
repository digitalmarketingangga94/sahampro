'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import type { WatchlistItem, WatchlistGroup } from '@/lib/types';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface WatchlistPageContentProps {
  // onSelect?: (symbol: string) => void; // Removed as it will navigate directly
}

export default function WatchlistPageContent(/* { onSelect } : WatchlistPageContentProps */) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const router = useRouter(); // Initialize useRouter

  // Fetch groups and watchlist items
  useEffect(() => {
    const fetchGroups = async () => {
      if (groups.length === 0) setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/watchlist/groups');
        const json = await res.json();
        
        if (!json.success) {
          // If it's a known error (like token issue), show it
          if (json.error && (json.error.includes('token') || json.error.includes('auth'))) {
            setError(json.error);
          }
          return;
        }

        if (Array.isArray(json.data) && json.data.length > 0) {
          setGroups(json.data);
          // If no group is selected yet, or the current selected group is not in the new groups list
          const currentGroupExists = json.data.some((g: WatchlistGroup) => g.watchlist_id === selectedGroupId);
          if (!selectedGroupId || !currentGroupExists) {
            const defaultG = json.data.find((g: WatchlistGroup) => g.is_default) || json.data[0];
            setSelectedGroupId(defaultG?.watchlist_id || null);
          }
        } else {
          setError('No watchlist groups found');
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load watchlist groups');
      } finally {
        if (!selectedGroupId) setLoading(false);
      }
    };

    fetchGroups();
  }, [refreshSeed]);

  // Fetch watchlist items when group changes or refreshSeed changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchWatchlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/watchlist?groupId=${selectedGroupId}`);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch watchlist');
        }

        const payload = json.data;
        const data = payload?.data?.result || payload?.data || [];
        setWatchlist(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [selectedGroupId, refreshSeed]);

  // Handle token refresh event
  useEffect(() => {
    const handleTokenRefresh = () => {
      console.log('Token refreshed event received, triggering watchlist refresh');
      setRefreshSeed(prev => prev + 1);
    };

    window.addEventListener('token-refreshed', handleTokenRefresh);
    return () => window.removeEventListener('token-refreshed', handleTokenRefresh);
  }, []);

  // Handle real-time flag updates from InputForm
  useEffect(() => {
    const handleFlagUpdate = (event: any) => {
      const { emiten, flag } = event.detail;
      setWatchlist(prev => prev.map(item => {
        if ((item.symbol || item.company_code).toUpperCase() === emiten.toUpperCase()) {
          return { ...item, flag };
        }
        return item;
      }));
    };

    window.addEventListener('emiten-flagged' as any, handleFlagUpdate);
    return () => window.removeEventListener('emiten-flagged' as any, handleFlagUpdate);
  }, []);

  const selectedGroup = groups.find(g => g.watchlist_id === selectedGroupId);

  const handleStockClick = (symbol: string) => {
    router.push(`/?symbol=${symbol}`); // Navigate to Calculator page with symbol param
  };

  if (loading && groups.length === 0) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Watchlist</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto 1rem' }}></div>
          <div style={{ fontSize: '0.8rem' }}>Loading Watchlist...</div>
        </div>
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Watchlist</h3>
        <div className="glass-card" style={{ 
          padding: '1rem', 
          background: 'rgba(245, 87, 108, 0.05)', 
          border: '1px solid rgba(245, 87, 108, 0.2)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {error.includes('token') || error.includes('auth') ? '🔴 Session Expired' : '❌ Error'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
            {error.includes('token') || error.includes('auth') 
              ? 'Please login to Stockbit via the extension and wait for connection.' 
              : error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}> {/* Changed to glass-card-static for page content */}
      {/* Header with Group Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.75rem'
          }}>
            Watchlist
          </h3>
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {watchlist.length}
          </span>
        </div>

        {groups.length > 1 && (
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.8rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {groups.map(g => (
              <option key={g.watchlist_id} value={g.watchlist_id} style={{ background: '#1a1a1a' }}>
                {g.emoji ? `${g.emoji} ` : ''}{g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading indicator when switching groups */}
      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
          Loading...
        </div>
      )}

      {error && groups.length > 0 && (
        <div style={{ 
          color: 'var(--accent-warning)', 
          fontSize: '0.75rem', 
          padding: '0.75rem', 
          textAlign: 'center',
          background: 'rgba(245, 87, 108, 0.05)',
          borderRadius: '8px',
          marginBottom: '0.5rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div
        className="watchlist-items-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          maxHeight: 'calc(100vh - 160px)', // Adjusted for full page, might need more tuning
          overflowY: 'auto'
        }}
      >
        {watchlist.map((item, index) => {
          const percentValue = parseFloat(item.percent) || 0;
          const isPositive = percentValue >= 0;

          return (
            <div
              key={item.company_id || index}
              className="watchlist-item"
              onClick={() => handleStockClick(item.symbol || item.company_code)}
              style={{ padding: '0.65rem 0.75rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.symbol || item.company_code}</div>
                  {item.flag === 'OK' && (
                    <CheckCircle2 size={12} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />
                  )}
                  {item.flag === 'NG' && (
                    <XCircle size={12} color="#f97316" fill="rgba(249, 115, 22, 0.2)" />
                  )}
                  {item.flag === 'Neutral' && (
                    <MinusCircle size={12} color="var(--text-secondary)" />
                  )}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#999',
                  marginTop: '2px',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.sector || item.company_name}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {item.formatted_price || item.last_price?.toLocaleString() || '-'}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: isPositive ? 'var(--accent-success)' : 'var(--accent-warning)',
                  marginTop: '1px',
                  fontWeight: 500
                }}>
                  {isPositive ? '+' : ''}{item.percent}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}