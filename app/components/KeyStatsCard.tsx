'use client';

import type { KeyStatsData, KeyStatsItem } from '@/lib/types';

interface KeyStatsCardProps {
  emiten: string;
  keyStats: KeyStatsData;
}

export default function KeyStatsCard({ emiten, keyStats }: KeyStatsCardProps) {
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

  return (
    <div className="keystats-card">
      {/* Header */}
      <div className="compact-header">
        <div className="compact-ticker">📊 Key Stats</div>
        <div className="compact-date">{emiten.toUpperCase()}</div>
      </div>

      {/* Sections */}
      {renderSection('Current Valuation', keyStats.currentValuation, 6)}
      {renderSection('Income Statement', keyStats.incomeStatement, 4)}
      {renderSection('Balance Sheet', keyStats.balanceSheet, 5)}
      {renderSection('Profitability', keyStats.profitability, 3)}
      {renderSection('Growth', keyStats.growth, 3)}
    </div>
  );
}
