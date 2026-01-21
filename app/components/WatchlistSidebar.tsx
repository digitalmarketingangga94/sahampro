'use client';

import { useEffect, useState } from 'react';
import type { WatchlistItem, WatchlistGroup } from '@/lib/types';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

interface WatchlistSidebarProps {
  onSelect?: (symbol: string) => void;
}

export default function WatchlistSidebar({ onSelect }: WatchlistSidebarProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

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

  if (loading && groups.length === 0) {
    return (
      <div className="p-4">
        <h3 className="mb-4 text-text-secondary text-xs uppercase tracking-wider">Watchlist</h3>
        <div className="text-center text-text-secondary py-8">
          <div className="spinner w-5 h-5 mx-auto mb-4"></div>
          <div className="text-sm">Loading Watchlist...</div>
        </div>
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div className="p-4">
        <h3 className="mb-4 text-text-secondary text-xs uppercase tracking-wider">Watchlist</h3>
        <div className="bg-accent-warning/[0.05] border border-accent-warning/[0.2] rounded-xl p-4 text-center">
          <div className="text-accent-warning text-sm mb-2">
            {error.includes('token') || error.includes('auth') ? '🔴 Session Expired' : '❌ Error'}
          </div>
          <div className="text-text-secondary text-xs leading-tight">
            {error.includes('token') || error.includes('auth') 
              ? 'Please login to Stockbit via the extension and wait for connection.' 
              : error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with Group Selector */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="m-0 text-text-secondary uppercase tracking-wider text-xs">
            Watchlist
          </h3>
          <span className="text-text-muted bg-white/[0.1] px-2 py-1 rounded-md text-xs">
            {watchlist.length}
          </span>
        </div>

        {groups.length > 1 && (
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            className="w-full p-2 text-sm bg-white/[0.05] border border-white/[0.1] rounded-lg text-text-primary cursor-pointer outline-none focus:border-accent-primary transition-all"
          >
            {groups.map(g => (
              <option key={g.watchlist_id} value={g.watchlist_id} className="bg-secondary">
                {g.emoji ? `${g.emoji} ` : ''}{g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading indicator when switching groups */}
      {loading && (
        <div className="text-center text-text-secondary p-4">
          Loading...
        </div>
      )}

      {error && groups.length > 0 && (
        <div className="text-accent-warning text-xs p-3 text-center bg-accent-warning/[0.05] rounded-lg mb-2">
          ⚠️ {error}
        </div>
      )}

      <div
        className="flex flex-col gap-1 max-h-[calc(100vh-160px)] overflow-y-auto"
      >
        {watchlist.map((item, index) => {
          const percentValue = parseFloat(item.percent) || 0;
          const isPositive = percentValue >= 0;

          return (
            <div
              key={item.company_id || index}
              className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-white/[0.05] transition-colors"
              onClick={() => onSelect?.(item.symbol || item.company_code)}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="font-semibold text-sm">{item.symbol || item.company_code}</div>
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
                <div className="text-xs text-text-muted mt-0.5 max-w-[140px] truncate">
                  {item.sector || item.company_name}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="font-semibold text-sm">
                  {item.formatted_price || item.last_price?.toLocaleString() || '-'}
                </div>
                <div className={`text-xs mt-0.5 font-medium ${isPositive ? 'text-accent-success' : 'text-accent-warning'}`}>
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