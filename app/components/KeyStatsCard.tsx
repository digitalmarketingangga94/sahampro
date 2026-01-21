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
      <div className="mb-4">
        <div className="text-sm font-semibold text-text-primary mb-2">{title}</div>
        <table className="w-full text-sm">
          <tbody>
            {displayItems.map((item) => (
              <tr key={item.id} className="border-b border-border-color/[0.5] last:border-b-0">
                <td className="py-1.5 text-text-secondary">{formatLabel(item.name)}</td>
                <td className="py-1.5 text-right font-medium text-text-primary">{item.value || '-'}</td>
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
    <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-color">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <div className="text-xs font-extrabold text-text-muted uppercase tracking-wider">Key Stats</div>
        </div>
        <div className="text-sm font-bold text-accent-primary">{emiten.toUpperCase()}</div>
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