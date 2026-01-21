'use client';

import WatchlistPageContent from '../components/WatchlistPageContent';

export default function WatchlistPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>My Watchlist</h2>
      <WatchlistPageContent />
    </div>
  );
}