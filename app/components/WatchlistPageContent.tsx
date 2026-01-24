'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WatchlistItem, WatchlistGroup, ApiResponse, WatchlistResponse } from '@/lib/types'; // Import ApiResponse
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface WatchlistPageContentProps {
  onSelectSymbol?: (symbol: string) => void; // New prop
}

// Helper to format large numbers (e.g., 1234567890 -> 1.23B)
const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString();
};

export default function WatchlistPageContent({ onSelectSymbol }: WatchlistPageContentProps) { // Accept new prop
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const router = useRouter();

  // Fetch groups and watchlist items
  useEffect(() => {
    const fetchGroups = async () => {
      if (groups.length === 0) setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/watchlist/groups');
        const json: ApiResponse<WatchlistGroup[]> = await res.json(); // Use ApiResponse type
        
        if (!json.success) {
          // Check for 401 status explicitly if available, otherwise rely on error message
          if (res.status === 401) {
            setError('🔴 Session Expired: Please login to Stockbit via the extension and wait for connection.');
          } else {
            setError(json.error || 'Failed to load watchlist groups');
          }
          return;
        }

        if (Array.isArray(json.data) && json.data.length > 0) {
          setGroups(json.data);
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
        const json: ApiResponse<WatchlistResponse> = await response.json(); // Use ApiResponse type

        if (!json.success) {
          if (response.status === 401) {
            setError('🔴 Session Expired: Please login to Stockbit via the extension and wait for connection.');
          } else {
            throw new Error(json.error || 'Failed to fetch watchlist');
          }
          return;
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
    if (onSelectSymbol) {
      onSelectSymbol(symbol); // Use the prop if provided (for sidebar usage)
    } else {
      router.push(`/?symbol=${symbol}`); // Fallback to navigation (for standalone page usage)
    }
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

  if (error && groups.length > 0) {
    return (
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
            {error.includes('Session Expired') ? '🔴 Session Expired' : '❌ Error'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: '1.4' }}>
            {error.includes('Session Expired') 
              ? 'Please login to Stockbit via the extension and wait for connection.' 
              : error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
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

      {watchlist.length > 0 && (
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Symbol</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Change (%)</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Volume</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Value</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Freq</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item, index) => {
                const percentValue = parseFloat(item.percent) || 0;
                const isPositive = percentValue >= 0;

                return (
                  <tr
                    key={item.company_id || index}
                    className="watchlist-item"
                    style={{ borderBottom: index < watchlist.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                  >
                    <td 
                      style={{ padding: '0.65rem 0.5rem', cursor: 'pointer' }}
                      onClick={() => handleStockClick(item.symbol || item.company_code)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>{item.symbol || item.company_code}</div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#999',
                        marginTop: '2px',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.sector || item.company_name}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.last_price?.toLocaleString() || '-'}
                    </td>
                    <td style={{ 
                      padding: '0.65rem 0.5rem', 
                      textAlign: 'right', 
                      fontSize: '0.8rem',
                      color: isPositive ? 'var(--accent-success)' : 'var(--accent-warning)',
                      fontWeight: 500
                    }}>
                      {isPositive ? '+' : ''}{item.percent}%
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCompactNumber(item.volume)}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCompactNumber(item.value)}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                      {formatCompactNumber(item.frequency)}
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