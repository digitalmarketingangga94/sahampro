'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import Calculator from './components/Calculator';

// Loading component for suspense boundary
const CalculatorLoading = () => (
  <div className="app-main">
    <div className="text-center mt-8">
      <div className="spinner" style={{ margin: '0 auto' }}></div>
      <p>Loading calculator...</p>
    </div>
  </div>
);

export default function Home() {
  const [selectedSymbolFromSidebar, setSelectedSymbolFromSidebar] = useState<string | null>(null);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Suspense fallback={<CalculatorLoading />}>
          <Calculator selectedSymbolFromSidebar={selectedSymbolFromSidebar} />
        </Suspense>
      </div>
    </div>
  );
}