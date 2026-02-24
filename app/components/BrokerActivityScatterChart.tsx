'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  LabelList,
} from 'recharts';
import type { BrokerStockActivityPerBroker } from '@/lib/types';

interface BrokerActivityScatterChartProps {
  data: BrokerStockActivityPerBroker[];
  loading: boolean;
  error: string | null;
  selectedBrokerTypes: string[];
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
    const data = payload[0].payload; // Access the original data object

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)', // Changed to white background
        border: '1px solid rgba(0,0,0,0.1)', // Darker border
        borderRadius: '8px',
        padding: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)', // Primary text color (dark)
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>{data.broker_code} ({data.stock_code})</p>
        <p style={{ color: 'var(--text-secondary)' }}>Stock Name: {data.stock_name || '-'}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Broker Type: {data.broker_type}</p>
        <p style={{ color: data.net_value >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>Net Value: {formatChartValue(data.net_value)}</p>
        <p style={{ color: 'var(--accent-success)' }}>Buy Value: {formatChartValue(data.buy_value)}</p>
        <p style={{ color: 'var(--accent-warning)' }}>Sell Value: {formatChartValue(data.sell_value)}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Buy Avg Price: {data.buy_avg_price?.toLocaleString() || '-'}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Sell Avg Price: {data.sell_avg_price?.toLocaleString() || '-'}</p>
      </div>
    );
  }
  return null;
};

// Custom Label component to display broker code and dominant percentage
const CustomActivityLabel = (props: any) => {
  const { x, y, payload } = props;
  if (!payload) return null; // Defensive check for undefined payload
  const { broker_code, percentage_of_stock_net_value } = payload;
  const displayPercentage = percentage_of_stock_net_value > 0.1 ? ` (${percentage_of_stock_net_value.toFixed(1)}%)` : '';
  return (
    <text x={x} y={y} dy={-10} textAnchor="middle" fill="black" fontSize={10}>
      {broker_code}{displayPercentage}
    </text>
  );
};

export default function BrokerActivityScatterChart({
  data,
  loading,
  error,
  selectedBrokerTypes,
}: BrokerActivityScatterChartProps) {
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

  // Define colors for broker types
  const brokerTypeColors: { [key: string]: string } = {
    'Smartmoney': '#007bff', // Primary accent (blue)
    'Foreign': '#28a745',      // Success accent (green)
    'Retail': '#dc3545',     // Warning accent (red)
    'Mix': '#ffc107',        // Yellow/Orange
    'Unknown': '#6C757D',    // Muted gray
  };

  // Filter data based on selectedBrokerTypes
  const filteredChartData = data.filter(item => 
    (item.broker_type && selectedBrokerTypes.includes(item.broker_type))
  );

  // Calculate total net value per stock across all filtered brokers
  const totalNetValuePerStock = filteredChartData.reduce((acc: { [stockCode: string]: number }, item) => {
    acc[item.stock_code] = (acc[item.stock_code] || 0) + Math.abs(item.net_value);
    return acc;
  }, {} as { [stockCode: string]: number }); // Explicitly type the initial accumulator

  // Add dominant percentage to each item
  const chartDataWithDominance = filteredChartData.map(item => ({
    ...item,
    percentage_of_stock_net_value: totalNetValuePerStock[item.stock_code] > 0
      ? (Math.abs(item.net_value) / totalNetValuePerStock[item.stock_code]) * 100
      : 0,
  }));

  // Group data by broker_type for separate scatters
  const groupedData = chartDataWithDominance.reduce((acc, item) => {
    const type = item.broker_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as { [key: string]: typeof chartDataWithDominance });

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            type="number"
            dataKey="net_value" // X-axis: Net Value
            name="Net Value"
            tickFormatter={formatChartValue}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
          >
            <Label value="Net Value (IDR)" offset={-10} position="insideBottom" fill="var(--text-secondary)" fontSize={12} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="buy_value" // Y-axis: Total Buy Value (IDR)
            name="Total Buy Value"
            tickFormatter={formatChartValue}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
          >
            <Label value="Total Buy Value (IDR)" angle={-90} offset={-10} position="insideLeft" fill="var(--text-secondary)" fontSize={12} />
          </YAxis>
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />

          {Object.entries(groupedData).map(([brokerType, dataPoints]) => (
            <Scatter
              key={brokerType}
              name={brokerType === 'Smartmoney' ? 'Smart Money' : brokerType} // Adjust name for legend
              data={dataPoints}
              fill="white" // White background for the circle
              stroke={brokerTypeColors[brokerType]} // Border color based on broker type
              strokeWidth={2}
              opacity={0.8}
              shape="circle"
              line={false}
            >
              <LabelList content={<CustomActivityLabel />} />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}