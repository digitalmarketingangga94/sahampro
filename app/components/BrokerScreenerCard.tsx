'use client';

import { useState, useEffect, useRef } from 'react';
import { BROKERS, BrokerInfo } from '@/lib/brokers';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import type { BrokerScreenerResultItem } from '@/lib/types';
import { Search, ChevronDown, Plus, Minus, RotateCcw, Play } from 'lucide-react';

interface BrokerScreenerCardProps {}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  // Allow up to 3 decimal places for Net Lot, but don't force them if not present
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
};

const formatAvgPerDay = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  // Format Avg / Day with 2 decimal places
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatPrice = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return Math.round(num).toLocaleString('id-ID');
};

type SortColumn = 'symbol' | 'net_direction' | 'net_lot' | 'avg_per_day' | 'avg_price' | 'dominant_broker' | 'dominant_percent' | 'consistency_positive_days';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

export default function BrokerScreenerCard({}: BrokerScreenerCardProps) {
  const [nDays, setNDays] = useState<number>(4);
  const [netBuy, setNetBuy] = useState<boolean>(true); // true for Net Buy, false for Net Sell
  const [minPositiveDays, setMinPositiveDays] = useState<number>(3); // NEW: for consistency rule
  const [consistencyLookbackDays, setConsistencyLookbackDays] = useState<number>(5); // NEW: for consistency rule
  const [selectedBrokerCodes, setSelectedBrokerCodes] = useState<string[]>(['AK', 'MG']); // Default brokers
  const [screenerResults, setScreenerResults] = useState<BrokerScreenerResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBrokerSelect, setShowBrokerSelect] = useState<number | null>(null); // Index of broker dropdown being shown
  const [searchTerm, setSearchTerm] = useState('');
  const brokerSelectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'dominant_percent', direction: 'desc' }); // Default sort by dominant_percent desc

  const brokerOptions = Object.values(BROKERS ?? {}).sort((a, b) => a.code.localeCompare(b.code));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBrokerSelect !== null && brokerSelectRefs.current[showBrokerSelect] && !brokerSelectRefs.current[showBrokerSelect]?.contains(event.target as Node)) {
        setShowBrokerSelect(null);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrokerSelect]);

  const handleRunScreener = async () => {
    if (selectedBrokerCodes.length === 0) {
      setError('Please select at least one broker.');
      return;
    }
    if (nDays <= 0) {
      setError('Number of days for EOD must be greater than 0.');
      return;
    }
    if (minPositiveDays <= 0 || consistencyLookbackDays <= 0 || minPositiveDays > consistencyLookbackDays) {
      setError('Consistency days must be valid (min positive days > 0, lookback days > 0, min positive days <= lookback days).');
      return;
    }

    setLoading(true);
    setError(null);
    setScreenerResults([]);

    try {
      const brokerCodesParam = selectedBrokerCodes.join(',');
      const response = await fetch(
        `/api/broker-screener?brokerCodes=${brokerCodesParam}&nDays=${nDays}&netBuy=${netBuy}&minPositiveDays=${minPositiveDays}&consistencyLookbackDays=${consistencyLookbackDays}`
      );
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch broker screener results');
      }
      
      setScreenerResults(json.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const addBrokerInput = () => {
    setSelectedBrokerCodes(prev => [...prev, '']); // Add an empty string for a new broker
  };

  const removeBrokerInput = (index: number) => {
    setSelectedBrokerCodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleBrokerChange = (index: number, code: string) => {
    setSelectedBrokerCodes(prev => {
      const newCodes = [...prev];
      newCodes[index] = code;
      return newCodes;
    });
    setShowBrokerSelect(null); // Close dropdown after selection
    setSearchTerm('');
  };

  const handleReset = () => {
    setNDays(4);
    setNetBuy(true); // Default to Net Buy
    setMinPositiveDays(3); // Reset consistency
    setConsistencyLookbackDays(5); // Reset consistency
    setSelectedBrokerCodes(['AK', 'MG']);
    setScreenerResults([]);
    setError(null);
    setLoading(false);
    setSortConfig({ column: 'dominant_percent', direction: 'desc' }); // Reset sort config to dominant_percent
  };

  const handleSort = (column: SortColumn) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortConfig.column === column) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  const sortedResults = [...screenerResults].sort((a, b) => {
    if (sortConfig.column === null) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortConfig.column) {
      case 'symbol':
        aValue = a.symbol;
        bValue = b.symbol;
        break;
      case 'net_direction':
        aValue = a.net_direction;
        bValue = b.net_direction;
        break;
      case 'net_lot':
        aValue = a.net_lot;
        bValue = b.net_lot;
        break;
      case 'avg_per_day':
        aValue = a.avg_per_day;
        bValue = b.avg_per_day;
        break;
      case 'avg_price':
        aValue = a.avg_price;
        bValue = b.avg_price;
        break;
      case 'dominant_broker':
        aValue = a.dominant_broker;
        bValue = b.dominant_broker;
        break;
      case 'dominant_percent':
        aValue = a.dominant_percent;
        bValue = b.dominant_percent;
        break;
      case 'consistency_positive_days': // NEW sort column
        aValue = a.consistency_positive_days || 0;
        bValue = b.consistency_positive_days || 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const filteredBrokerOptions = brokerOptions.filter(broker => 
    broker.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const screenDate = getLatestTradingDate();
  const broksumEOD = getLatestTradingDate();

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal', marginBottom: '1rem' }}>
        BROKER SCREENER
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Mengidentifikasi saham yang aktif diperdagangkan oleh kombinasi broker pilihan di setiap hari dari EOD sampai N day, dengan konsistensi Net Lot positif.
      </p>

      <div className="screener-controls">
        <div className="screener-row">
          <div className="input-group compact-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
            <label htmlFor="nDays" className="input-label compact-label">EOD → N day</label>
            <input
              id="nDays"
              type="number"
              value={nDays}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNDays(isNaN(value) ? 1 : value); // Default to 1 if NaN
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="1"
            />
          </div>

          {/* Net Buy / Net Sell Buttons */}
          <div className="input-group compact-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
            <label className="input-label compact-label">Direction</label>
            <div className="broker-flow-filters" style={{ padding: '2px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                className={`broker-flow-filter-btn ${netBuy ? 'active' : ''}`}
                onClick={() => setNetBuy(true)}
                style={{ flex: 1, fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Net Buy
              </button>
              <button
                type="button"
                className={`broker-flow-filter-btn ${!netBuy ? 'active' : ''}`}
                onClick={() => setNetBuy(false)}
                style={{ flex: 1, fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Net Sell
              </button>
            </div>
          </div>

          {/* NEW: Consistency Rule Inputs */}
          <div className="input-group compact-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
            <label htmlFor="minPositiveDays" className="input-label compact-label">Min Pos Days</label>
            <input
              id="minPositiveDays"
              type="number"
              value={minPositiveDays}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setMinPositiveDays(isNaN(value) ? 1 : value);
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="1"
            />
          </div>
          <div className="input-group compact-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
            <label htmlFor="consistencyLookbackDays" className="input-label compact-label">Lookback Days</label>
            <input
              id="consistencyLookbackDays"
              type="number"
              value={consistencyLookbackDays}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setConsistencyLookbackDays(isNaN(value) ? 1 : value);
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="1"
            />
          </div>

          {selectedBrokerCodes.map((brokerCode, index) => (
            <div key={index} style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }} ref={el => { brokerSelectRefs.current[index] = el; }}>
              <label className="input-label compact-label" style={{ opacity: index === 0 ? 1 : 0 }}>
                {index === 0 ? 'Broker' : 'AND'}
              </label>
              <button
                type="button"
                className="input-field compact-input"
                onClick={() => setShowBrokerSelect(index)}
                style={{ 
                  width: '100%', 
                  height: '32px', 
                  padding: '0 0.5rem', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span>{brokerCode ? `${brokerCode} - ${BROKERS[brokerCode]?.name || 'Unknown'}` : 'Pilih Broker'}</span>
                <ChevronDown size={14} />
              </button>
              {showBrokerSelect === index && (
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
                        onClick={() => handleBrokerChange(index, broker.code)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: selectedBrokerCodes[index] === broker.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                          background: selectedBrokerCodes[index] === broker.code ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                          transition: 'background 0.1s ease'
                        }}
                      >
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
          ))}
        </div>

        <div className="screener-actions">
          <button type="button" onClick={addBrokerInput} className="btn btn-secondary compact-btn">
            <Plus size={16} /> Add Broker
          </button>
          {selectedBrokerCodes.length > 1 && (
            <button type="button" onClick={() => removeBrokerInput(selectedBrokerCodes.length - 1)} className="btn btn-danger compact-btn">
              <Minus size={16} /> Remove Broker
            </button>
          )}
          <button type="button" onClick={handleReset} className="btn btn-outline compact-btn">
            <RotateCcw size={16} /> Reset
          </button>
          <button type="button" onClick={handleRunScreener} disabled={loading} className="btn btn-primary compact-btn">
            {loading ? 'Running...' : <><Play size={16} /> Run Screener</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center', marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : sortedResults.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Result Data
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Screen Date: {screenDate} • Broksum EOD: {broksumEOD} • {sortedResults.length} saham ditemukan • Days: {nDays} • Broker: {selectedBrokerCodes.length} • Must Net Buy: {netBuy ? 'YES' : 'NO'}
            </span>
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol {getSortIndicator('symbol')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('net_direction')}
                  >
                    Net Direction {getSortIndicator('net_direction')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('net_lot')}
                  >
                    Net Lot {getSortIndicator('net_lot')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('avg_per_day')}
                  >
                    Avg / Day {getSortIndicator('avg_per_day')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('avg_price')}
                  >
                    Avg Price {getSortIndicator('avg_price')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('dominant_broker')}
                  >
                    Dominant Broker {getSortIndicator('dominant_broker')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('dominant_percent')}
                  >
                    Dominant % {getSortIndicator('dominant_percent')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('consistency_positive_days')}
                  >
                    Consistency {getSortIndicator('consistency_positive_days')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((item, index) => {
                  return (
                    <tr key={item.symbol} style={{ borderBottom: index < sortedResults.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)', textAlign: 'left' }}>
                        {item.symbol}
                        {item.stock_name && item.stock_name !== item.symbol && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.stock_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                        <span style={{ color: item.net_direction === 'Net Buy' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                          • {item.net_direction}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{formatNumber(item.net_lot)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{formatAvgPerDay(item.avg_per_day)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{formatPrice(item.avg_price)}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{item.dominant_broker}</td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>{item.dominant_percent !== undefined ? item.dominant_percent.toFixed(2) : '-'}%</span>
                          <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                            <div style={{ width: `${item.dominant_percent || 0}%`, height: '100%', background: 'var(--accent-success)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                        {item.consistency_positive_days !== undefined && item.consistency_total_days !== undefined ? (
                          <span style={{ color: item.consistency_positive_days >= minPositiveDays ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                            {item.consistency_positive_days}/{item.consistency_total_days}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}