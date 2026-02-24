'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { IHSGDailyChartData, IHSGPricePoint } from '@/lib/types';
import { Flag } from 'lucide-react'; // Assuming Flag icon is for Indonesia

interface IHSGDailyChartCardProps {
  height?: number;
}

// Helper to format large numbers for volume
const formatVolume = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString('id-ID');
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const value = parseFloat(dataPoint.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const change = parseFloat(dataPoint.change).toLocaleString('id-ID', { signDisplay: 'exceptZero', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const percentage = parseFloat(dataPoint.percentage).toFixed(2);
    const isPositive = parseFloat(dataPoint.change) >= 0;

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '5px' }}>{dataPoint.formatted_date.split(' ')[1]}</p>
        <p>IHSG: <span style={{ fontWeight: 700 }}>{value}</span></p>
        <p style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
          Change: {change} ({isPositive ? '+' : ''}{percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function IHSGDailyChartCard({ height = 300 }: IHSGDailyChartCardProps) {
  const [ihsgData, setIhsgData] = useState<IHSGDailyChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ihsg-daily-chart');
        const json = await response.json();

        if (json.success) {
          setIhsgData(json.data);
        } else {
          throw new Error(json.error || 'Failed to fetch IHSG daily chart data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching IHSG data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestPrice = ihsgData?.prices?.[ihsgData.prices.length - 1];
  const isPositive = latestPrice && parseFloat(latestPrice.change.toString()) >= 0;

  // Filter data for chart to only include points with valid values
  const chartData = ihsgData?.prices.filter(p => p.value && parseFloat(p.value) > 0)
    .map(p => ({
      ...p,
      value: parseFloat(p.value),
      time: p.formatted_date.split(' ')[1].substring(0, 5), // Extract HH:MM
    })) || [];

  if (loading) {
    return (
      <div className="glass-card-static ihsg-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static ihsg-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-warning)' }}>
        {error}
      </div>
    );
  }

  if (!ihsgData || !latestPrice) {
    return (
      <div className="glass-card-static ihsg-card" style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No IHSG data available.
      </div>
    );
  }

  return (
    <div className="glass-card-static ihsg-card" style={{ padding: '1rem', height: `${height}px` }}>
      <div className="ihsg-header">
        <div className="ihsg-title-group">
          <div className="ihsg-icon">I</div>
          <div>
            <div className="ihsg-index-name">IHSG <Flag size={16} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /></div>
            <div className="ihsg-full-name">Index Harga Saham Gabungan</div>
          </div>
        </div>
        <div className="ihsg-followers">
          849,893 followers
          <button className="ihsg-follow-btn">+ Follow</button>
        </div>
      </div>

      <div className="ihsg-summary">
        <div className="ihsg-price-info">
          <span className="ihsg-current-price">{parseFloat(latestPrice.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`ihsg-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{parseFloat(ihsgData.change.toString()).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositive ? '+' : ''}{parseFloat(ihsgData.percentage).toFixed(2)}%)
          </span>
          <div className="ihsg-timestamp">Today {new Date(latestPrice.formatted_date).toLocaleDateString('en-GB', { weekday: 'short' })} {new Date(latestPrice.formatted_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
        </div>
        <div className="ihsg-volume">
          {formatVolume(latestPrice.volume || '0')}
          <div className="ihsg-volume-label">Volume</div>
        </div>
      </div>

      <div className="ihsg-chart-container" style={{ height: 'calc(100% - 120px)', marginTop: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIHSG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? 'var(--accent-success)' : 'var(--accent-warning)'} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isPositive ? 'var(--accent-success)' : 'var(--accent-warning)'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              interval="preserveStartEnd"
              tickFormatter={(tick) => {
                const hour = parseInt(tick.split(':')[0]);
                if (hour % 1 === 0) return tick; // Show every hour mark
                return '';
              }}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis
              dataKey="value"
              orientation="right"
              tickFormatter={(tick) => parseFloat(tick).toLocaleString('id-ID')}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={{ stroke: 'var(--border-color)' }}
              domain={['dataMin - 50', 'dataMax + 50']} // Adjust domain for better visualization
            />
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? 'var(--accent-success)' : 'var(--accent-warning)'}
              fillOpacity={1}
              fill="url(#colorIHSG)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}