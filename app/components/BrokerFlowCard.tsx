'use client';

import { useState, useEffect } from 'react';
import type { BrokerFlowResponse, BrokerFlowActivity, BrokerFlowDailyData } from '@/lib/types';
import { getBrokerInfo } from '@/lib/brokers';

interface BrokerFlowCardProps {
  emiten: string;
}

type LookbackDays = 1 | 7 | 14 | 21;

// Format large numbers (e.g., 24322664000 -> "+24.3 B")
function formatNetValue(value: string): string {
  const num = parseFloat(value);
  const absNum = Math.abs(num);
  const sign = num >= 0 ? '+' : '-';
  
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
    <div className="flex items-center gap-1 h-9">
      <span className="text-[0.6rem] text-text-muted min-w-[22px]">D-{tradingDates.length - 1}</span>
      
      <div className="flex items-center gap-0.5 h-full relative min-w-[120px]">
        {/* Baseline (x-axis) */}
        <div className="absolute left-0 right-0 h-0.5 bg-white/[0.08] rounded-sm top-1/2 -translate-y-1/2" />
        
        {tradingDates.slice().reverse().map((date, idx) => {
          const data = dataMap.get(date);
          const netVal = data?.n || 0;
          const barHeight = (Math.abs(netVal) / maxVal) * (midPoint - 2); // padding from edges
          const isPositive = netVal >= 0;
          
          return (
            <div key={idx} className="w-3 h-full relative">
              <div
                style={{
                  height: `${Math.max(2, barHeight)}px`,
                  bottom: isPositive ? `${midPoint}px` : 'auto',
                  top: !isPositive ? `${midPoint}px` : 'auto',
                }}
                className={`absolute left-0 right-0 rounded-sm opacity-100 z-10 transition-all duration-300 ease-in-out ${isPositive ? 'bg-accent-success' : 'bg-accent-warning'} ${data ? '' : 'opacity-20'}`}
                title={`${date}: ${data ? formatNetValue(String(data.n)) : 'No data'}`}
              />
            </div>
          );
        })}
      </div>
      
      <span className="text-[0.6rem] text-text-muted min-w-[18px]">D0</span>
    </div>
  );
}

export default function BrokerFlowCard({ emiten }: BrokerFlowCardProps) {
  const [data, setData] = useState<BrokerFlowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookbackDays, setLookbackDays] = useState<LookbackDays>(7);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['Bandar', 'Whale', 'Retail', 'Mix']);

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

  const filterOptions: LookbackDays[] = [1, 7, 14, 21];
  const statusOptions = [
    { id: 'Bandar', label: 'Smart Money' },
    { id: 'Whale', label: 'Whale' },
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
    <div className="bg-card border border-border-color rounded-xl p-4 shadow-md flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-color">
        <span className="text-lg font-bold text-text-primary">Broker Flow</span>
        <div className="flex gap-2 items-center">
          {/* Status Filters */}
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedStatus.includes(opt.id) ? 'bg-accent-primary text-white' : 'bg-secondary text-text-secondary hover:bg-white/[0.1]'}`}
                onClick={() => toggleStatus(opt.id)}
                title={`Toggle ${opt.label}`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-border-color mx-0.5" />

          {/* Time Filters */}
          <div className="flex gap-1">
            {filterOptions.map((days) => (
              <button
                key={days}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${lookbackDays === days ? 'bg-accent-primary text-white' : 'bg-secondary text-text-secondary hover:bg-white/[0.1]'}`}
                onClick={() => setLookbackDays(days)}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="p-8 text-center">
          <div className="spinner w-6 h-6 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="p-4 text-accent-warning text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          {data.activities.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              No broker activity found for {emiten}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-text-muted border-b border-border-color">
                  <th className="py-2 font-normal">#</th>
                  <th className="py-2 font-normal">BROKER</th>
                  <th className="py-2 font-normal">DAILY HEATMAP</th>
                  <th className="py-2 font-normal text-right">NET VALUE</th>
                  <th className="py-2 font-normal text-right">CONSISTENCY</th>
                </tr>
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
  
  const statusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bandar':
      case 'smartmoney': return 'bg-blue-600';
      case 'whale': return 'bg-purple-600';
      case 'retail': return 'bg-red-600';
      case 'mix': return 'bg-gray-600';
      default: return 'bg-gray-700';
    }
  };

  return (
    <tr className="border-b border-border-color/[0.5] last:border-b-0">
      <td className="py-2 text-text-muted">{index}</td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <span 
            className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColorClass(activity.broker_status)} text-white`}
            title={brokerInfo.name}
          >
            {activity.broker_code}
          </span>
          <span 
            className={`text-xs opacity-80 ${displayType.toLowerCase() === 'smart money' ? 'text-blue-400' : displayType.toLowerCase() === 'whale' ? 'text-purple-400' : displayType.toLowerCase() === 'retail' ? 'text-red-400' : 'text-gray-400'}`}
          >
            {displayType}
          </span>
        </div>
      </td>
      <td className="py-2">
        <DailyHeatmap dailyData={activity.daily_data} tradingDates={tradingDates} />
      </td>
      <td className={`py-2 text-right font-medium ${parseFloat(activity.net_value) >= 0 ? 'text-accent-success' : 'text-accent-warning'}`}>
        {formatNetValue(activity.net_value)}
      </td>
      <td className="py-2 text-right">
        <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-text-secondary">
          {activity.buy_days}/{activity.active_days}
        </span>
      </td>
    </tr>
  );
}