'use client';

import SectorPerformanceCard from '../components/SectorPerformanceCard';
import IHSGDailyChartCard from '../components/IHSGDailyChartCard'; // Import new component
import React, { Suspense, useState } from 'react';

export default function DashboardPage() {
  // Removed selectedSymbol and selectedInterval states as they are no longer needed
  // Removed handleSymbolChange and handleIntervalChange functions

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Column: Placeholder or other content */}
        <div style={{ flex: '3 1 700px', minWidth: '400px' }}>
          <div className="glass-card-static" style={{ padding: '1rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {/* Placeholder for where the TradingView chart used to be */}
            <p>TradingView chart removed.</p>
          </div>
        </div>

        {/* Right Column: Sector Performance and IHSG Daily Chart */}
        <div style={{ flex: '1 1 350px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <IHSGDailyChartCard height={350} />
          <SectorPerformanceCard />
        </div>
      </div>
    </div>
  );
}