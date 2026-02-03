'use client';

import { Suspense } from 'react';
import CalculatorContent from './components/CalculatorContent'; // Import the new client component

export default function Home() {
  return (
    <div className="app-layout">
      <div className="app-main">
        <Suspense fallback={
          <div className="text-center" style={{ paddingTop: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="text-secondary mt-2">Loading analysis tools...</p>
          </div>
        }>
          <CalculatorContent />
        </Suspense>
      </div>
    </div>
  );
}