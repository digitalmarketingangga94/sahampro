'use client';

import { useState, useEffect, useRef } from 'react';
import { BROKERS, BrokerInfo, BrokerType } from '@/lib/brokers';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import type { BrokerOverallActivitySummary, BrokerBuyItem, BrokerSellItem, BrokerStockActivityPerBroker } from '@/lib/types';
import { ChevronLeft, ChevronRight, Search, Check, ChevronDown, Table, LineChart } from 'lucide-react'; // Import Table and LineChart icons
import BrokerActivityScatterChart from './BrokerActivityScatterChart'; // Import the new scatter chart component

interface BrokerActivityDetailCardProps {
  initialBrokerCode?: string;
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('id-ID');
};

const formatValueCompact = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('id-ID');
};

export default function BrokerActivityDetailCard({ initialBrokerCode }: BrokerActivityDetailCardProps) {
  const [selectedBrokerCodes, setSelectedBrokerCodes] = useState<string[]>(initialBrokerCode ? [initialBrokerCode] : ['ZP']);
  const [fromDate, setFromDate] = useState(getLatestTradingDate());
  const [toDate, setToDate] = useState(getLatestTradingDate());
  const [processedActivityData, setProcessedActivityData] = useState<BrokerStockActivityPerBroker[]>([]); // Changed type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrokerTypes, setSelectedBrokerTypes] = useState<BrokerType[]>(['Smartmoney', 'Foreign', 'Retail', 'Mix']);
  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const brokerSelectRef = useRef<HTMLDivElement>(null);

  // New states for stock selection
  const [selectedStockCodes, setSelectedStockCodes] = useState<string[]>([]);
  const [showStockSelect, setShowStockSelect] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [allStockOptions, setAllStockOptions] = useState<{ code: string; name?: string }[]>([]);
  const stockSelectRef = useRef<HTMLDivElement>(null);


  const brokerOptions = Object.values(BROKERS ?? {}).sort((a, b) => a.code.localeCompare(b.code));

  useEffect(() => {
    if (selectedBrokerCodes.length === 0 || !fromDate || !toDate) {
      setProcessedActivityData([]);
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const brokerCodesParam = selectedBrokerCodes.join(',');
        const response = await fetch(
          `/api/broker-activity-detail?brokerCodes=${brokerCodesParam}&fromDate=${fromDate}&toDate=${toDate}`
        );
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch broker activity detail');
        }
        
        setProcessedActivityData(json.data);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [selectedBrokerCodes, fromDate, toDate]);

  // New useEffect to populate allStockOptions from processedActivityData
  useEffect(() => {
    const uniqueStocks = new Map<string, { code: string; name?: string }>();
    processedActivityData.forEach(item => {
      if (!uniqueStocks.has(item.stock_code)) {
        uniqueStocks.set(item.stock_code, { code: item.stock_code, name: item.stock_name });
      }
    });
    setAllStockOptions(Array.from(uniqueStocks.values()).sort((a, b) => a.code.localeCompare(b.code)));
  }, [processedActivityData]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brokerSelectRef.current && !brokerSelectRef.current.contains(event.target as Node)) {
        setShowBrokerSelect(false);
        setSearchTerm('');
      }
      if (stockSelectRef.current && !stockSelectRef.current.contains(event.target as Node)) {
        setShowStockSelect(false);
        setStockSearchTerm('');
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
    setSelectedBrokerCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code) 
        : [...prev, code]
    );
  };

  const toggleStockSelection = (code: string) => {
    setSelectedStockCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code) 
        : [...prev, code]
    );
  };

  // Filter the data based on selectedBrokerTypes AND selectedStockCodes
  const filteredActivityData = processedActivityData.filter(item => 
    (item.broker_type && selectedBrokerTypes.includes(item.broker_type)) &&
    (selectedStockCodes.length === 0 || selectedStockCodes.includes(item.stock_code))
  );

  const filteredBrokerOptions = brokerOptions.filter(broker => 
    broker.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStockOptions = allStockOptions.filter(stock => 
    stock.code.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    (stock.name && stock.name.toLowerCase().includes(stockSearchTerm.toLowerCase()))
  );

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Broker Activity Detail
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Multi-select Stock Dropdown */}
          <div style={{ position: 'relative' }} ref={stockSelectRef}>
            <button
              type="button"
              className="input-field compact-input"
              onClick={() => setShowStockSelect(!showStockSelect)}
              style={{ 
                width: '180px', 
                height: '32px', 
                padding: '0 0.5rem', 
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span>{selectedStockCodes.length > 0 ? selectedStockCodes.join(', ') : 'Select Stocks'}</span>
              <ChevronDown size={14} />
            </button>
            {showStockSelect && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                minWidth: '300px',
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
                      placeholder="Search stock..."
                      value={stockSearchTerm}
                      onChange={(e) => setStockSearchTerm(e.target.value)}
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
                {filteredStockOptions.length > 0 ? (
                  filteredStockOptions.map(stock => (
                    <div
                      key={stock.code}
                      onClick={() => toggleStockSelection(stock.code)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: selectedStockCodes.includes(stock.code) ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: selectedStockCodes.includes(stock.code) ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                        transition: 'background 0.1s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStockCodes.includes(stock.code)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      {stock.code} {stock.name && stock.name !== stock.code ? `- ${stock.name}` : ''}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No matching stocks found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multi-select Broker Dropdown (existing) */}
          <div style={{ position: 'relative' }} ref={brokerSelectRef}>
            <button
              type="button"
              className="input-field compact-input"
              onClick={() => setShowBrokerSelect(!showBrokerSelect)}
              style={{ 
                width: '180px', 
                height: '32px', 
                padding: '0 0.5rem', 
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span>{selectedBrokerCodes.length > 0 ? selectedBrokerCodes.join(', ') : 'Select Brokers'}</span>
              <ChevronDown size={14} />
            </button>
            {showBrokerSelect && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                minWidth: '300px',
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
                  filteredBrokerOptions.map(broker => (
                    <div
                      key={broker.code}
                      onClick={() => toggleBrokerSelection(broker.code)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: selectedBrokerCodes.includes(broker.code) ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: selectedBrokerCodes.includes(broker.code) ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                        transition: 'background 0.1s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrokerCodes.includes(broker.code)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      {broker.code} - {broker.name}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0.6rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No brokers found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date range and quick date buttons (existing) */}
          <div className="date-range-group" style={{ height: '32px', borderRadius: '8px' }}>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
            />
            <span className="date-separator" style={{ margin: '0 1px', padding: 0 }}>→</span>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
            />
          </div>
          <button type="button" onClick={() => handleDateRangeChange(1)} className="quick-date-btn">1D</button>
          <button type="button" onClick={() => handleDateRangeChange(7)} className="quick-date-btn">7D</button>
          <button type="button" onClick={() => handleDateRangeChange(14)} className="quick-date-btn">14D</button>
          <button type="button" onClick={() => handleDateRangeChange(30)} className="quick-date-btn">1M</button>
          <button type="button" onClick={() => handleDateRangeChange(60)} className="quick-date-btn">2M</button>
          <button type="button" onClick={() => handleDateRangeChange(90)} className="quick-date-btn">3M</button>

          {/* View Mode Toggle (existing) */}
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

      {viewMode === 'table' ? (
        loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
          </div>
        ) : error ? (
          <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        ) : filteredActivityData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
            No activity found for the selected brokers and filters in the period.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Broker</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Symbol</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>B.Val</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>B.Lot</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>B.Avg</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>S.Val</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>S.Lot</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>S.Avg</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: (filteredActivityData[0].net_value || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>Net Val</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: (filteredActivityData[0].net_lot || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>Net Lot</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivityData.map((item, index) => (
                    <tr key={`${item.broker_code}-${item.stock_code}-${index}`} style={{ borderBottom: index < filteredActivityData.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {item.broker_code}
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.broker_type}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {item.stock_code}
                        {item.stock_name && item.stock_name !== item.stock_code && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.stock_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatValueCompact(item.buy_value)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatValueCompact(item.buy_lot)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatNumber(item.buy_avg_price)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatValueCompact(item.sell_value)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatValueCompact(item.sell_lot)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatNumber(item.sell_avg_price)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: (item.net_value || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {formatValueCompact(item.net_value)}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: (item.net_lot || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {formatValueCompact(item.net_lot)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : (
        <BrokerActivityScatterChart
          data={filteredActivityData}
          loading={loading}
          error={error}
          selectedBrokerCodes={selectedBrokerCodes}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}
    </div>
  );
}