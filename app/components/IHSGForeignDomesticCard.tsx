'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { IHSGForeignDomesticChartData, ForeignDomesticValueWithPercentage } from '@/lib/types';
import { Globe } from 'lucide-react';

interface IHSGForeignDomesticCardProps {
  height?: number;
}

// Helper to format large numbers for display
const formatValue = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000_000) return `${sign}${(absValue / 1_000_000_000_000).toFixed(2)}T`;
  if (absValue >= 1_000_000_000) return `${sign}${(absValue / 1_000_000_000).toFixed(2)}B`;
  if (absValue >= 1_000_000) return `${sign}${(absValue / 1_000_000).toFixed(2)}M`;
  if (absValue >= 1_000) return `${sign}${(absValue / 1_000).toFixed(2)}K`;
  return `${sign}${absValue.toLocaleString('id-ID')}`;
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>{label}</p>
        <p style={{ color: '#007bff' }}>Foreign Buy: {formatValue(data.foreign_buy)} ({data.foreign_buy_pct}%)</p>
        <p style={{ color: '#dc3545' }}>Foreign Sell: {formatValue(data.foreign_sell)} ({data.foreign_sell_pct}%)</p>
        <p style={{ color: '#28a745' }}>Domestic Buy: {formatValue(data.domestic_buy)} ({data.domestic_buy_pct}%)</p>
        <p style={{ color: '#ffc107' }}>Domestic Sell: {formatValue(data.domestic_sell)} ({data.domestic_sell_pct}%)</p>
      </div>
    );
  }
  return null;
};

export default function IHSGForeignDomesticCard({ height = 350 }: IHSGForeignDomesticCardProps) {
  const [ihsgFdData, setIhsgFdData] = useState<IHSGForeignDomesticChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ihsg-foreign-domestic-chart');
        const json = await response.json();

        if (json.success) {
          setIhsgFdData(json.data);
        } else {
          throw new Error(json.error || 'Failed to fetch IHSG foreign/domestic chart data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching IHSG foreign/domestic data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card-static ihsg-fd-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static ihsg-fd-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-warning)' }}>
        {error}
      </div>
    );
  }

  if (!ihsgFdData) {
    return (
      <div className="glass-card-static ihsg-fd-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No IHSG Foreign/Domestic data available.
      </div>
    );
  }

  const chartData = [
    {
      name: 'Foreign',
      buy: ihsgFdData.value.foreign_buy.raw,
      sell: ihsgFdData.value.foreign_sell.raw,
      buy_pct: ihsgFdData.value.foreign_buy.percentage.raw,
      sell_pct: ihsgFdData.value.foreign_sell.percentage.raw,
    },
    {
      name: 'Domestic',
      buy: ihsgFdData.value.domestic_buy.raw,
      sell: ihsgFdData.value.domestic_sell.raw,
      buy_pct: ihsgFdData.value.domestic_buy.percentage.raw,
      sell_pct: ihsgFdData.value.domestic_sell.percentage.raw,
    },
  ];

  const summary = ihsgFdData.summary;
  const netForeignBuyRegular = summary.net_foreign.raw;
  const isNetForeignPositive = netForeignBuyRegular >= 0;

  return (
    <div className="glass-card-static ihsg-fd-card" style={{ padding: '1rem', height: `${height}px` }}>
      <div className="ihsg-fd-header">
        <div className="ihsg-fd-title-group">
          <Globe size={20} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <div className="ihsg-fd-index-name">IHSG Foreign & Domestic</div>
            <div className="ihsg-fd-full-name">Net Buy/Sell Value (Regular Market)</div>
          </div>
        </div>
        <div className="ihsg-fd-date">
          {summary.date_range}
        </div>
      </div>

      <div className="ihsg-fd-summary">
        <div className="ihsg-fd-net-foreign">
          <span className="ihsg-fd-net-label">Net Foreign</span>
          <span className={`ihsg-fd-net-value ${isNetForeignPositive ? 'positive' : 'negative'}`}>
            {formatValue(netForeignBuyRegular)}
          </span>
        </div>
        <div className="ihsg-fd-net-domestic">
          <span className="ihsg-fd-net-label">Net Domestic</span>
          <span className={`ihsg-fd-net-value ${!isNetForeignPositive ? 'positive' : 'negative'}`}>
            {formatValue(summary.net_domestic.raw)}
          </span>
        </div>
      </div>

      <div className="ihsg-fd-chart-container" style={{ height: 'calc(100% - 120px)', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-primary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis
              tickFormatter={(tick) => formatValue(tick)}
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={{ stroke: 'var(--border-color)' }}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />
            <Bar dataKey="buy" name="Buy Value" fill="#007bff" />
            <Bar dataKey="sell" name="Sell Value" fill="#dc3545" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}