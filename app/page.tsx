'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';
import WatchlistSidebar from './components/WatchlistSidebar';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="flex-grow overflow-y-auto">
        <Calculator selectedStock={selectedStock} />
      </div>
      <div className="w-full lg:w-64 lg:min-w-64 border-t lg:border-t-0 lg:border-l border-border-color h-auto lg:h-screen overflow-y-auto sticky top-0 lg:top-0">
        <WatchlistSidebar onSelect={setSelectedStock} />
      </div>
    </div>
  );
}