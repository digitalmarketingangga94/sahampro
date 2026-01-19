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

  if (loading) return <div>Loading watchlist...</div>;
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
  if (watchlist.length === 0) return <div>No watchlist items found</div>;

  return (
    <div>
      <h2>All Watchlist</h2>
      <ul>
        {watchlist.map((item, idx) => (
          <li key={idx}>
            {item.symbol || item.company_code} - {item.sector || item.company_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
