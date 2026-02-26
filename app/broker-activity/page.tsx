'use client';

import { useState } from 'react';
import BrokerActivityDetailCard from '../components/BrokerActivityDetailCard';
import BrokerScreenerCard from '../components/BrokerScreenerCard';
import BrokerForeignScreenerCard from '../components/BrokerForeignScreenerCard'; // Import the new component

type BrokerActivityView = 'screener' | 'summary' | 'foreign-screener'; // Added 'foreign-screener'

export default function BrokerActivityPage() {
  const [activeView, setActiveView] = useState<BrokerActivityView>('screener');

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
          className={`tab-button ${activeView === 'foreign-screener' ? 'active' : ''}`}
          onClick={() => setActiveView('foreign-screener')}
        >
          Net Foreign Accumulation
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
      {activeView === 'foreign-screener' && <BrokerForeignScreenerCard />}
      {activeView === 'summary' && <BrokerActivityDetailCard />}
    </div>
  );
}