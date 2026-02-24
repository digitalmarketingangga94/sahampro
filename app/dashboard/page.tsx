'use client';

import TradingViewChart from '../components/TradingViewChart';
import React, { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>
      <div className="glass-card-static" style={{ padding: '1rem' }}>
        <Suspense fallback={
          <div className="text-center" style={{ paddingTop: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="text-secondary mt-2">Loading chart...</p>
          </div>
        }>
          <TradingViewChart symbol="IDX:AMMN" theme="dark" height={600} />
        </Suspense>
      </div>
    </div>
  );
}