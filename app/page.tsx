'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';
import WatchlistPageContent from './components/WatchlistPageContent'; // Import WatchlistPageContent

export default function Home() {
  const [selectedSymbolFromSidebar, setSelectedSymbolFromSidebar] = useState<string | null>(null);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator selectedSymbolFromSidebar={selectedSymbolFromSidebar} />
      </div>
      <div className="app-sidebar">
        <WatchlistPageContent onSelectSymbol={setSelectedSymbolFromSidebar} />
      </div>
    </div>
  );
}