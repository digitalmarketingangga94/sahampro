'use client';

import type { KeyStatsData, KeyStatsItem } from '@/lib/types';
import React from 'react';

interface KeyStatsColumnTwoCardProps {
  emiten: string;
  keyStats: KeyStatsData;
}

// Helper to render a stats section
const renderSection = (title: string, items: KeyStatsItem[], maxItems: number = 5) => {
  if (!items || items.length === 0) return null;
  
  const displayItems = items.slice(0, maxItems);
  
  return (
    <div className="keystats-section">
      <div className="keystats-section-title">{title}</div>
      <table className="keystats-table">
        <tbody>
          {displayItems.map((item) => (
            <tr key={item.id}>
              <td className="keystats-label">{formatLabel(item.name)}</td>
              <td className="keystats-value">{item.value || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Format label to be shorter
const formatLabel = (name: string): string => {
  return name
    .replace('Current ', '')
    .replace(' (TTM)', '')
    .replace(' (Quarter)', '')
    .replace(' (Quarter YoY Growth)', ' YoY')
    .replace('Price to ', 'P/')
    .replace('Ratio', '');
};

export default function KeyStatsColumnTwoCard({ emiten, keyStats }: KeyStatsColumnTwoCardProps) {
  return (
    <div className="glass-card-static" style={{ width: '350px', padding: '0.75rem 1rem' }}>
      {/* Header (optional, can be removed if not needed for second card) */}
      <div className="compact-header" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Stats (Cont.)</div>
        </div>
        <div className="compact-date">{emiten.toUpperCase()}</div>
      </div>

      {renderSection('Income Statement', keyStats.incomeStatement, 4)}
      {renderSection('Balance Sheet', keyStats.balanceSheet, 5)}
      {renderSection('Growth', keyStats.growth, 3)}
    </div>
  );
}