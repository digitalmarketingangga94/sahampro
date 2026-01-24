'use client';

import React, { useState, useEffect } from 'react';

interface GrahamFormulaCardProps {
  emiten: string;
  currentPrice: number;
  eps: number;
}

export default function GrahamFormulaCard({ emiten, currentPrice, eps }: GrahamFormulaCardProps) {
  const [growthRate, setGrowthRate] = useState<number>(10); // Default growth rate 10%
  const [intrinsicValue, setIntrinsicValue] = useState<number | null>(null);

  useEffect(() => {
    if (eps > 0 && growthRate >= 0) {
      // Graham Formula: Intrinsic Value = EPS × (8.5 + 2g)
      // g is in percentage, so convert to decimal for calculation (e.g., 10% -> 10)
      const calculatedValue = eps * (8.5 + (2 * growthRate));
      setIntrinsicValue(Math.round(calculatedValue));
    } else {
      setIntrinsicValue(null);
    }
  }, [eps, growthRate]);

  const isUndervalued = intrinsicValue !== null && currentPrice < intrinsicValue;
  const isOvervalued = intrinsicValue !== null && currentPrice > intrinsicValue;

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Graham Formula ({emiten.toUpperCase()})
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EPS: {eps.toLocaleString()}</span>
          <div className="input-group" style={{ marginBottom: 0, width: '100px' }}>
            <label htmlFor="growthRate" className="input-label compact-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Growth (%)</label>
            <input
              id="growthRate"
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="0"
              max="50"
              step="1"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Harga Saat Ini</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Rp {currentPrice.toLocaleString()}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nilai Intrinsik</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            {intrinsicValue !== null ? `Rp ${intrinsicValue.toLocaleString()}` : '-'}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</div>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: '700',
            color: isUndervalued ? 'var(--accent-success)' : (isOvervalued ? 'var(--accent-warning)' : 'var(--text-secondary)')
          }}>
            {intrinsicValue !== null ? (
              isUndervalued ? 'Undervalued' : (isOvervalued ? 'Overvalued' : 'Fair Value')
            ) : '-'}
          </div>
          {intrinsicValue !== null && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {isUndervalued && `(${((intrinsicValue - currentPrice) / currentPrice * 100).toFixed(1)}% potensi naik)`}
              {isOvervalued && `(${((currentPrice - intrinsicValue) / currentPrice * 100).toFixed(1)}% potensi turun)`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}