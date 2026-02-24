'use client';

import { useState } from 'react';
import BrokerStocksViewCard from '../components/BrokerStocksViewCard'; // Updated import
import BrokerScreenerCard from '../components/BrokerScreenerCard';

type BrokerActivityView = 'summary' | 'movement' | 'stocks-view' | 'screener'; // Added 'movement' and 'stocks-view'

export default function BrokerActivityPage() {
  const [activeView, setActiveView] = useState<BrokerActivityView>('stocks-view'); // Set default to 'stocks-view'

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Broker Activity</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Analisa movement broker melalui net buy–sell, distribusi, dan dinamika aktivitas antar Stocks.
      </p>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '2rem' }}>
        <button
          className={`tab-button ${activeView === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveView('summary')}
        >
          Summary
        </button>
        <button
          className={`tab-button ${activeView === 'movement' ? 'active' : ''}`}
          onClick={() => setActiveView('movement')}
        >
          Movement
        </button>
        <button
          className={`tab-button ${activeView === 'stocks-view' ? 'active' : ''}`}
          onClick={() => setActiveView('stocks-view')}
        >
          Stocks View
        </button>
        <button
          className={`tab-button ${activeView === 'screener' ? 'active' : ''}`}
          onClick={() => setActiveView('screener')}
        >
          Screener
        </button>
      </div>

      {/* Content based on active tab */}
      {activeView === 'summary' && (
        <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Summary content coming soon!
        </div>
      )}
      {activeView === 'movement' && (
        <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Movement content coming soon!
        </div>
      )}
      {activeView === 'stocks-view' && <BrokerStocksViewCard />}
      {activeView === 'screener' && <BrokerScreenerCard />}
    </div>
  );
}