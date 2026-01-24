'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BrokerStockActivity } from '@/lib/types';

interface BrokerActivityChartProps {
  data: BrokerStockActivity[];
  loading: boolean;
  error: string | null;
  selectedBrokerCodes: string[];
  fromDate: string;
  toDate: string;
}

// Helper to format large numbers for tooltips/labels
const formatChartValue = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

// Custom Tooltip for better readability
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const stockCode = label;
    const netValue = payload[0].value;
    const buyValue = payload[1]?.value;
    const sellValue = payload[2]?.value;

    return (
      <div style={{
        background: 'rgba(30, 30, 45, 0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>{stockCode}</p>
        {buyValue !== undefined && <p style={{ color: '#38ef7d' }}>Buy Value: {formatChartValue(buyValue)}</p>}
        {sellValue !== undefined && <p style={{ color: '#f5576c' }}>Sell Value: {formatChartValue(sellValue)}</p>}
        <p style={{ color: netValue >= 0 ? '#38ef7d' : '#f5576c' }}>Net Value: {formatChartValue(netValue)}</p>
      </div>
    );
  }
  return null;
};

export default function BrokerActivityChart({
  data,
  loading,
  error,
  selectedBrokerCodes,
  fromDate,
  toDate,
}: BrokerActivityChartProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#f5576c', fontSize: '0.8rem' }}>
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
        No broker activity data available for chart.
      </div>
    );
  }

  // Prepare data for the chart
  // We'll show net_value, buy_value, and sell_value for each stock
  const chartData = data.map(item => ({
    stock_code: item.stock_code,
    net_value: item.net_value || 0,
    buy_value: item.buy_value || 0,
    sell_value: item.sell_value || 0,
  }));

  return (
    <div style={{ width: '100%', height: '500px' }}> {/* Fixed height for the chart container */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="stock_code"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={formatChartValue}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
            label={{ value: 'Value (IDR)', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />
          <Bar dataKey="net_value" name="Net Value" fill="#667eea" />
          <Bar dataKey="buy_value" name="Buy Value" fill="#38ef7d" opacity={0.7} />
          <Bar dataKey="sell_value" name="Sell Value" fill="#f5576c" opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}