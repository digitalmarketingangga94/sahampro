'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getLatestTradingDate } from '@/lib/utils';

interface SectorPerformanceItem {
  index: string;
  '30D': number;
  '90D': number;
  '120D': number;
  'W_AVG': number;
}

export default function SectorPerformanceCard() {
  const [performanceData, setPerformanceData] = useState<SectorPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/sector-performance');
        const json = await response.json();

        if (json.success) {
          setPerformanceData(json.data);
          setLastUpdated(json.lastUpdated);
        } else {
          throw new Error(json.error || 'Failed to fetch sector performance');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching sector performance');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    return (
      <span style={{ color: value >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
        {value >= 0 ? '+' : ''}{formatted}%
      </span>
    );
  };

  return (
    <div className="glass-card-static sector-performance-card">
      <div className="sector-performance-header">
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Sector vs IDXCOMPOSITE
        </h3>
        <div className="last-updated-info">
          Last: {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="sector-performance-table">
            <thead>
              <tr>
                <th>Index</th>
                <th>30D</th>
                <th>90D</th>
                <th>120D</th>
                <th className="w-avg-header">
                  W AVG <ChevronDown size={14} />
                </th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={item.index} style={{ borderBottom: index < performanceData.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.index}</td>
                  <td style={{ textAlign: 'right' }}>{formatPercentage(item['30D'])}</td>
                  <td style={{ textAlign: 'right' }}>{formatPercentage(item['90D'])}</td>
                  <td style={{ textAlign: 'right' }}>{formatPercentage(item['120D'])}</td>
                  <td style={{ textAlign: 'right' }}>{formatPercentage(item['W_AVG'])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}