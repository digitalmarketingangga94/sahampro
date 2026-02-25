'use client';

import React from 'react';
import type { MarketMoverItem } from '@/lib/types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface StockHeatmapGridProps {
  stocks: MarketMoverItem[];
}

export default function StockHeatmapGrid({ stocks }: StockHeatmapGridProps) {
  if (!stocks || stocks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No stock data available for heatmap.
      </div>
    );
  }

  return (
    <div className="stock-heatmap-grid">
      {stocks.map((stock) => (
        <Link href={`/?symbol=${stock.symbol}`} key={stock.symbol} passHref style={{ textDecoration: 'none' }}>
          <div
            className={`stock-tile ${stock.change_percentage >= 0 ? 'positive' : 'negative'}`}
            title={`${stock.name} (${stock.symbol}): ${stock.change_percentage.toFixed(2)}%`}
          >
            <div className="stock-tile-header">
              <span className="stock-symbol">{stock.symbol}</span>
              {stock.change_percentage >= 0 ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            <div className="stock-change">
              {stock.change_percentage.toFixed(2)}%
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}