'use client';

import { useState, useEffect } from 'react';
import type { BrokerFlowResponse, BrokerFlowActivity, BrokerFlowDailyData } from '@/lib/types';
import { getBrokerInfo } from '@/lib/brokers';
import BrokerFlowScatterChart from './BrokerFlowScatterChart'; // Import the new scatter chart component
import { Table, LineChart } from 'lucide-react'; // Import icons

interface BrokerFlowCardProps {
  emiten: string;
}

// Format large numbers (e.g., 24322664000 -> "+24.3 B")
function formatNetValue(value: string): string {
  const num = parseFloat(value);
  const absNum = Math.abs(num);
  const sign = num >= 0 ? '+' : '-' ;
  
  if (absNum >= 1e12) {
    return `${sign}${(absNum / 1e12).toFixed(1)} T`;
  } else if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(1)} B`;
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(1)} M`;
  } else {
    return `${sign}${absNum.toLocaleString()}`;
  }
}

// Render daily heatmap bars with x-axis baseline (buy above, sell below)
function DailyHeatmap({ dailyData, tradingDates }: { dailyData: BrokerFlowDailyData[], tradingDates: string[] }) {
  // Find max absolute value for scaling
  const maxVal = Math.max(...dailyData.map(d => Math.abs(d.n)), 1);
  
  // Create a map of date -> data for quick lookup
  const dataMap = new Map(dailyData.map(d => [d.d, d]));
  
  const containerHeight = 36;
  const midPoint = containerHeight / 2;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: `${containerHeight}px` }}>
      <span style={{ fontSize: '0.6rem', color: '#666', minWidth: '22px' }}>D-{tradingDates.length - 1}</span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '100%', position: 'relative', minWidth: '120px' }}>
        {/* Baseline (x-axis) */}
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          top: `${midPoint}px`, 
          height: '2px', 
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px'
        }} />
        
        {tradingDates.slice().reverse().map((date, idx) => {
          const data = dataMap.get(date);
          const netVal = data?.n || 0;
          const barHeight = (Math.abs(netVal) / maxVal) * (midPoint - 2); // padding from edges
          const isPositive = netVal >= 0;
          
          return (
            <div key={idx} style={{ width: '12px', height: '100%', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: `${Math.max(2, barHeight)}px`,
                  bottom: isPositive ? `${midPoint}px` : 'auto',
                  top: !isPositive ? `${midPoint}px` : 'auto',
                  backgroundColor: isPositive ? '#38ef7d' : '#f5576c',
                  borderRadius: '1px',
                  opacity: data ? 1 : 0.2,
                  zIndex: 1,
                  transition: 'all 0.3s ease'
                }}
                title={`${date}: ${data ? formatNetValue(String(data.n)) : 'No data'}`}
              />
            </div>
          );
        })}
      </div>
      
      <span style={{ fontSize: '0.6rem', color: '#666', minWidth: '18px' }}>D0</span>
    </div>
  );
}

export default function BrokerFlowCard({ emiten }: BrokerFlowCardProps) {
  const [data, setData] = useState<BrokerFlowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookbackDays, setLookbackDays] = useState<number>(7); // Keep as number
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['Bandar', 'Foreign', 'Retail', 'Mix']);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table'); // New state for view mode

  useEffect(() => {
    if (!emiten) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const statusParam = selectedStatus.length > 0 ? selectedStatus.join(',') : 'None';
        const response = await fetch(`/api/broker-flow?emiten=${emiten}&lookback_days=${lookbackDays}&broker_status=${statusParam}`);
        const json = await response.json();
        
        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch broker flow');
        }
        
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [emiten, lookbackDays, selectedStatus]);

  const filterOptions = [
    { label: '1D', value: 1 },
    { label: '7D', value: 7 },
    { label: '14D', value: 14 },
    { label: '1M', value: 30 }, // Approximate 1 month as 30 days
    { label: '2M', value: 60 }, // Approximate 2 months as 60 days
    { label: '3M', value: 90 }, // Approximate 3 months as 90 days
  ];
  const statusOptions = [
    { id: 'Bandar', label: 'Smart Money' },
    { id: 'Foreign', label: 'Foreign' },
    { id: 'Retail', label: 'Retail' },
    { id: 'Mix', label: 'Mix' }
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  return (
    <div className="broker-flow-card">
      {/* Header */}
      <div className="broker-flow-header">
        <span className="broker-flow-title">Broker Flow</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status Filters */}
          <div className="broker-flow-filters">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                className={`broker-flow-filter-btn ${selectedStatus.includes(opt.id) ? 'active' : ''}`}
                onClick={() => toggleStatus(opt.id)}
                title={`Toggle ${opt.label}`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '16px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Time Filters */}
          <div className="broker-flow-filters">
            {filterOptions.map((opt) => (
              <button
                key={opt.label}
                className={`broker-flow-filter-btn ${lookbackDays === opt.value ? 'active' : ''}`}
                onClick={() => setLookbackDays(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="broker-flow-filters" style={{ marginLeft: '8px' }}>
            <button
              className={`broker-flow-filter-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <Table size={14} />
            </button>
            <button
              className={`broker-flow-filter-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
              title="Chart View"
            >
              <LineChart size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }}></div>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', color: '#f5576c', fontSize: '0.8rem' }}>
            {error}
          </div>
        ) : data && (
          <div className="broker-flow-content">
            {data.activities.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                No broker activity found for {emiten}
              </div>
            ) : (
              <table className="broker-flow-table">
                <thead>
                  <tr><th>#</th><th>BROKER</th><th>DAILY HEATMAP</th><th style={{ textAlign: 'center' }}>NET VALUE</th><th style={{ textAlign: 'center' }}>CONSISTENCY</th></tr>
                </thead>
                <tbody>
                  {data.activities.map((activity, idx) => (
                    <BrokerFlowRow 
                      key={`${activity.broker_code}-${idx}`}
                      activity={activity} 
                      index={idx + 1}
                      tradingDates={data.trading_dates}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      ) : (
        <BrokerFlowScatterChart
          data={data}
          loading={loading}
          error={error}
          selectedStatus={selectedStatus}
        />
      )}
    </div>
  );
}

function BrokerFlowRow({ 
  activity, 
  index,
  tradingDates 
}: { 
  activity: BrokerFlowActivity; 
  index: number;
  tradingDates: string[];
}) {
  const brokerInfo = getBrokerInfo(activity.broker_code);
  const displayType = brokerInfo.type !== 'Unknown' 
    ? brokerInfo.type 
    : (activity.broker_status === 'Bandar' ? 'Smart Money' : activity.broker_status);
  
  return (
    <tr>
      <td className="row-num">{index}</td>
      <td className="broker-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className={`broker-code-badge ${activity.broker_status.toLowerCase()}`}
            title={brokerInfo.name}
            style={{ cursor: 'help' }}
          >
            {activity.broker_code}
          </span>
          <span 
            className={`broker-type-label ${brokerInfo.type !== 'Unknown' ? brokerInfo.type.toLowerCase() : activity.broker_status.toLowerCase()}`}
            style={{ fontSize: '0.65rem', opacity: 0.8 }}
          >
            {displayType}
          </span>
        </div>
      </td>
      <td className="heatmap-cell">
        <DailyHeatmap dailyData={activity.daily_data} tradingDates={tradingDates} />
      </td>
      <td className={`net-value ${parseFloat(activity.net_value) >= 0 ? 'positive' : 'negative'}`} style={{ textAlign: 'center' }}>
        {formatNetValue(activity.net_value)}
      </td>
      <td className="consistency" style={{ textAlign: 'center' }}>
        <span className="consistency-badge">
          {activity.buy_days}/{activity.active_days}
        </span>
      </td>
    </tr>
  );
}