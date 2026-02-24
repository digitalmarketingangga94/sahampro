'use client';

import IHSGDailyChartCard from '../components/IHSGDailyChartCard'; // Import new component
import React, { Suspense } from 'react';

export default function DashboardPage() {
  // Removed selectedSymbol and selectedInterval states as they are no longer needed
  // Removed handleSymbolChange and handleIntervalChange functions

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Only IHSG Daily Chart Card remains, taking full width */}
        <div style={{ flex: '1 1 100%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <IHSGDailyChartCard height={350} />
        </div>
      </div>
    </div>
  );
}