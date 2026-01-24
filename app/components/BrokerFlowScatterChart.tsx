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
import type { BrokerFlowResponse, BrokerFlowActivity } from '@/lib/types';
import { getBrokerInfo } from '@/lib/brokers'; // Import getBrokerInfo

interface BrokerFlowScatterChartProps {
  data: BrokerFlowResponse | null;
  loading: boolean;
  error: string | null;
  selectedStatus: string[];
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
    const brokerInfo = getBrokerInfo(data.broker_code);

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
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>{data.broker_code} ({data.stock_code})</p>
        <p style={{ color: 'var(--text-secondary)' }}>Broker Name: {brokerInfo.name}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Broker Type: {data.broker_type}</p>
        <p style={{ color: data.net_value >= 0 ? '#38ef7d' : '#f5576c' }}>Net Value: {formatChartValue(data.net_value)}</p>
        <p style={{ color: '#38ef7d' }}>Total Buy Volume: {formatChartValue(data.total_buy_volume)}</p>
        {/* Removed net_lot and sell_volume from tooltip as they are not directly available or derivable as volume */}
      </div>
    );
  }
  return null;
};

export default function BrokerFlowScatterChart({
  data,
  loading,
  error,
  selectedStatus,
}: BrokerFlowScatterChartProps) {
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

  if (!data || data.activities.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
        No broker activity data available for chart.
      </div>
    );
  }

  // Define colors for broker types (using internal BrokerType names)
  const brokerTypeColors: { [key: string]: string } = {
    'Smartmoney': '#667eea', // Primary accent
    'Foreign': '#38ef7d',      // Success accent
    'Retail': '#f5576c',     // Warning accent
    'Mix': '#f093fb',        // Purple/Pink
    'Unknown': '#a0a0b8',    // Muted
  };

  // Transform data for Recharts ScatterChart
  const chartData = data.activities
    .map(activity => {
      const brokerInfo = getBrokerInfo(activity.broker_code);
      return {
        broker_code: activity.broker_code,
        stock_code: activity.stock_code, // The emiten being analyzed
        broker_type: brokerInfo.type, // Use our internal broker type
        net_value: parseFloat(activity.net_value),
        total_buy_volume: parseFloat(activity.total_buy_volume), // Use total_buy_volume for Y-axis
      };
    })
    .filter(item => {
      // Map 'Smartmoney' back to 'Bandar' to match the selectedStatus array from the frontend buttons
      const statusToMatch = item.broker_type === 'Smartmoney' ? 'Bandar' : item.broker_type;
      return selectedStatus.includes(statusToMatch);
    });

  // Group data by broker_type for separate scatters
  const groupedData = chartData.reduce((acc, item) => {
    const type = item.broker_type || 'Unknown'; // This will be 'Smartmoney', 'Foreign', 'Retail', 'Mix', 'Unknown'
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as { [key: string]: typeof chartData });

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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            type="number"
            dataKey="net_value" // X-axis: Net Value
            name="Net Value"
            tickFormatter={formatChartValue}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
          >
            <Label value="Net Value (IDR)" offset={-10} position="insideBottom" fill="var(--text-secondary)" fontSize={12} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="total_buy_volume" // Y-axis: Total Buy Volume
            name="Total Buy Volume"
            tickFormatter={formatChartValue}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickLine={{ stroke: 'var(--border-color)' }}
          >
            <Label value="Total Buy Volume (Lot)" angle={-90} offset={-10} position="insideLeft" fill="var(--text-secondary)" fontSize={12} />
          </YAxis>
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />

          {Object.entries(groupedData).map(([brokerType, dataPoints]) => (
            <Scatter
              key={brokerType}
              name={brokerType === 'Smartmoney' ? 'Smart Money' : brokerType} // Adjust name for legend
              data={dataPoints}
              fill={brokerTypeColors[brokerType]} // Use the internal brokerType for colors
              opacity={0.8}
              shape="circle"
              line={false}
            >
              <LabelList dataKey="broker_code" position="top" fill="#fff" fontSize={10} />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}