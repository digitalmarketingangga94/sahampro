'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';
// import WatchlistSidebar from './components/WatchlistSidebar'; // Removed

export default function Home() {
  // const [selectedStock, setSelectedStock] = useState<string | null>(null); // Removed

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator /* selectedStock={selectedStock} */ /> {/* selectedStock prop removed */}
      </div>
      {/* Removed WatchlistSidebar */}
      {/* <div className="app-sidebar">
        <WatchlistSidebar onSelect={setSelectedStock} />
      </div> */}
    </div>
  );
}