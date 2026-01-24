'use client';

import { useState } from 'react';
import Calculator from './components/Calculator';
// import WatchlistPageContent from './components/WatchlistPageContent'; // Removed import

export default function Home() {
  const [selectedSymbolFromSidebar, setSelectedSymbolFromSidebar] = useState<string | null>(null);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator selectedSymbolFromSidebar={selectedSymbolFromSidebar} />
      </div>
      {/* Removed sidebar content as per request */}
      {/* <div className="app-sidebar">
        <WatchlistPageContent onSelectSymbol={setSelectedSymbolFromSidebar} />
      </div> */}
    </div>
  );
}