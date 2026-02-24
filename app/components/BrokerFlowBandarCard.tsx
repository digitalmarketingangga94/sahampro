'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import { BROKERS } from '@/lib/brokers';
import type { RunningTradeChartResponse, PriceChartDataItem, BrokerChartItem } from '@/lib/types';
import { CalendarDays, ChevronDown, Search, Plus, X } from 'lucide-react';

interface BrokerFlowBandarCardProps {
  emiten: string;
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
    const priceData = payload.find((p: any) => p.dataKey === 'price');
    const brokerData = payload.filter((p: any) => p.dataKey !== 'price');

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
        {priceData && (
          <p style={{ color: priceData.color }}>Price: {priceData.value.toLocaleString()}</p>
        )}
        {brokerData.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }}>
            {p.name}: {formatChartValue(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const brokerColors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#a4de6c', '#d0ed57', '#83a6ed'
];

export default function BrokerFlowBandarCard({ emiten }: BrokerFlowBandarCardProps) {
  const defaultEndDate = getLatestTradingDate();
  const defaultStartDate = getDateNDaysAgo(1, defaultEndDate); // Default to 2 days (today and yesterday)

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(defaultStartDate);
  const [toDate, setToDate] = useState(defaultEndDate);
  const [chartType, setChartType] = useState<'value' | 'volume'>('value');
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);
  const [availableBrokers, setAvailableBrokers] = useState<string[]>([]);
  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const brokerSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!emiten || !fromDate || !toDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setChartData([]);
      setAvailableBrokers([]);

      try {
        const response = await fetch(
          `/api/running-trade-chart?emiten=${emiten}&fromDate=${fromDate}&toDate=${toDate}`
        );
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch running trade chart data');
        }

        const rawData: RunningTradeChartResponse['data'] = json.data;

        // Prepare price data
        const priceMap = new Map<string, number>();
        rawData.price_chart_data.forEach(item => {
          priceMap.set(`${item.date} ${item.time}`, parseFloat(item.value.raw));
        });

        // Get all unique datetime labels
        const allDatetimeLabels = new Set<string>();
        rawData.price_chart_data.forEach(item => allDatetimeLabels.add(`${item.date} ${item.time}`));
        rawData.broker_chart_data.forEach(brokerTypeData => {
          brokerTypeData.charts.forEach(brokerChart => {
            brokerChart.chart.forEach(item => allDatetimeLabels.add(`${item.date} ${item.time}`));
          });
        });

        const sortedDatetimeLabels = Array.from(allDatetimeLabels).sort((a, b) => {
          const [dateA, timeA] = a.split(' ');
          const [dateB, timeB] = b.split(' ');
          const dateTimeA = new Date(`${dateA}T${timeA}:00`);
          const dateTimeB = new Date(`${dateB}T${timeB}:00`);
          return dateTimeA.getTime() - dateTimeB.getTime();
        });

        // Extract available brokers from the fetched data
        const brokersFromData = rawData.broker_chart_data
          .find(d => d.type === `TYPE_CHART_${chartType.toUpperCase()}`)
          ?.brokers || [];
        setAvailableBrokers(brokersFromData);

        // If no brokers are selected, default to the first 5 available
        if (selectedBrokers.length === 0 && brokersFromData.length > 0) {
          setSelectedBrokers(brokersFromData.slice(0, 5));
        }

        // Combine data for the chart
        const combinedChartData = sortedDatetimeLabels.map(label => {
          const [date, time] = label.split(' ');
          const entry: any = {
            name: `${date.substring(5)} ${time}`, // Format for X-axis label
            price: priceMap.get(label),
          };

          const currentBrokerChartData = rawData.broker_chart_data.find(
            d => d.type === `TYPE_CHART_${chartType.toUpperCase()}`
          );

          if (currentBrokerChartData) {
            currentBrokerChartData.charts.forEach(brokerChart => {
              if (selectedBrokers.includes(brokerChart.broker_code)) {
                const brokerValue = brokerChart.chart.find(item => `${item.date} ${item.time}` === label);
                entry[brokerChart.broker_code] = brokerValue ? parseFloat(brokerValue.value.raw) : null;
              }
            });
          }
          return entry;
        });

        setChartData(combinedChartData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emiten, fromDate, toDate, chartType, selectedBrokers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brokerSelectRef.current && !brokerSelectRef.current.contains(event.target as Node)) {
        setShowBrokerSelect(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateRangeChange = (days: number) => {
    const end = new Date(getLatestTradingDate());
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const toggleBrokerSelection = (code: string) => {
    setSelectedBrokers(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const filteredBrokerOptions = availableBrokers.filter(brokerCode =>
    brokerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (BROKERS[brokerCode]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Broker Flow Bandar ({emiten.toUpperCase()})
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Value/Volume Toggle */}
          <div className="broker-flow-filters">
            <button
              className={`broker-flow-filter-btn ${chartType === 'value' ? 'active' : ''}`}
              onClick={() => setChartType('value')}
            >
              Value
            </button>
            <button
              className={`broker-flow-filter-btn ${chartType === 'volume' ? 'active' : ''}`}
              onClick={() => setChartType('volume')}
            >
              Volume
            </button>
          </div>

          {/* Date range and quick date buttons */}
          <div className="date-range-group" style={{ height: '32px', borderRadius: '8px', flex: '1 1 220px', minWidth: '220px' }}>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="date-separator" style={{ margin: '0 1px', padding: 0 }}>→</span>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button type="button" onClick={() => handleDateRangeChange(1)} className="quick-date-btn">1D</button>
          <button type="button" onClick={() => handleDateRangeChange(7)} className="quick-date-btn">7D</button>
          <button type="button" onClick={() => handleDateRangeChange(14)} className="quick-date-btn">14D</button>
          <button type="button" onClick={() => handleDateRangeChange(30)} className="quick-date-btn">1M</button>
        </div>
      </div>

      {/* Selected Brokers Display */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Brokers:</span>
        {selectedBrokers.map((brokerCode, idx) => (
          <span
            key={brokerCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: brokerColors[idx % brokerColors.length],
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {brokerCode}
            <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleBrokerSelection(brokerCode)} />
          </span>
        ))}
        <div style={{ position: 'relative' }} ref={brokerSelectRef}>
          <button
            type="button"
            className="btn btn-secondary compact-btn"
            onClick={() => setShowBrokerSelect(!showBrokerSelect)}
            style={{ padding: '4px 8px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto' }}
          >
            <Plus size={14} /> Add
          </button>
          {showBrokerSelect && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              minWidth: '250px',
              zIndex: 1000,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search broker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.4rem 0.4rem 30px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              {filteredBrokerOptions.length > 0 ? (
                filteredBrokerOptions.map(brokerCode => (
                  <div
                    key={brokerCode}
                    onClick={() => toggleBrokerSelection(brokerCode)}
                    style={{
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: selectedBrokers.includes(brokerCode) ? 'var(--accent-primary)' : 'var(--text-primary)',
                      background: selectedBrokers.includes(brokerCode) ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrokers.includes(brokerCode)}
                      readOnly
                      style={{ cursor: 'pointer' }}
                    />
                    {brokerCode} - {BROKERS[brokerCode]?.name || 'Unknown'}
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No matching brokers found.
                </div>
              )}
            </div>
          )}
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
      ) : chartData.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
          No running trade chart data available for {emiten}.
        </div>
      ) : (
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={{ stroke: 'var(--border-color)' }}
                interval="preserveStartEnd"
              >
                <Label value="Time" offset={-10} position="insideBottom" fill="var(--text-primary)" fontSize={12} />
              </XAxis>
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#8884d8" // Price line color
                tickFormatter={(value) => value.toLocaleString()}
                tick={{ fill: '#8884d8', fontSize: 10 }}
                axisLine={{ stroke: '#8884d8' }}
                tickLine={{ stroke: '#8884d8' }}
              >
                <Label value="Price" angle={-90} offset={-10} position="insideLeft" fill="#8884d8" fontSize={12} />
              </YAxis>
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--text-secondary)" // Broker value/volume line color
                tickFormatter={formatChartValue}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--text-secondary)' }}
                tickLine={{ stroke: 'var(--text-secondary)' }}
              >
                <Label value={chartType === 'value' ? 'Net Value (IDR)' : 'Net Volume (Lot)'} angle={90} offset={-10} position="insideRight" fill="var(--text-primary)" fontSize={12} />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.75rem' }} />

              {/* Price Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                name="Price"
              />

              {/* Broker Lines */}
              {selectedBrokers.map((brokerCode, idx) => (
                <Line
                  key={brokerCode}
                  yAxisId="right"
                  type="monotone"
                  dataKey={brokerCode}
                  stroke={brokerColors[idx % brokerColors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={brokerCode}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}