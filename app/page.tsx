'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';
import WatchlistSidebar from './components/WatchlistSidebar';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator selectedStock={selectedStock} />
      </div>
      <div className="app-sidebar">
        <WatchlistSidebar onSelect={setSelectedStock} />
      </div>
    </div>
  );
}

