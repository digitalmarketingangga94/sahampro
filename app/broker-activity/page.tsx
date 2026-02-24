'use client';

import { useState } from 'react';
import BrokerActivityDetailCard from '../components/BrokerActivityDetailCard';
import BrokerScreenerCard from '../components/BrokerScreenerCard'; // Import the new screener card

type BrokerActivityView = 'screener' | 'summary'; // Changed order

export default function BrokerActivityPage() {
  const [activeView, setActiveView] = useState<BrokerActivityView>('screener'); // Set default to 'screener'

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Broker Activity</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Analisa movement broker melalui net buy–sell, distribusi, dan dinamika aktivitas antar Stocks.
      </p>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '2rem' }}>
        <button
          className={`tab-button ${activeView === 'screener' ? 'active' : ''}`}
          onClick={() => setActiveView('screener')}
        >
          Screener
        </button>
        <button
          className={`tab-button ${activeView === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveView('summary')}
        >
          Summary
        </button>
      </div>

      {/* Content based on active tab */}
      {activeView === 'screener' && <BrokerScreenerCard />}
      {activeView === 'summary' && <BrokerActivityDetailCard />}
    </div>
  );
}