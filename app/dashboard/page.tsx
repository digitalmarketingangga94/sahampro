'use client';

import TradingViewChart from '../components/TradingViewChart';
import DashboardControls from '../components/DashboardControls';
import React, { Suspense, useState } from 'react';

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('IDX:AMMN'); // Default symbol
  const [selectedInterval, setSelectedInterval] = useState('D'); // Default interval (Daily)

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>
      <div className="glass-card-static" style={{ padding: '1rem' }}>
        <DashboardControls
          currentSymbol={selectedSymbol}
          onSymbolChange={handleSymbolChange}
          currentInterval={selectedInterval}
          onIntervalChange={handleIntervalChange}
        />
        <Suspense fallback={
          <div className="text-center" style={{ paddingTop: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="text-secondary mt-2">Loading chart...</p>
          </div>
        }>
          <TradingViewChart symbol={selectedSymbol} interval={selectedInterval} theme="dark" height={1000} />
        </Suspense>
      </div>
    </div>
  );
}