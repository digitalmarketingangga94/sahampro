'use client';

import { useState, useEffect, useRef } from 'react';
import { BROKERS, BrokerInfo } from '@/lib/brokers';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import type { BrokerScreenerResultItem } from '@/lib/types';
import { Search, ChevronDown, Plus, Minus, RotateCcw, Play } from 'lucide-react';

interface BrokerScreenerCardProps {}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

const formatAvgPerDay = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

type SortColumn = 'symbol' | 'net_direction' | 'net_lot' | 'avg_per_day' | 'dominant_broker' | 'dominant_percent';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

export default function BrokerScreenerCard({}: BrokerScreenerCardProps) {
  const [nDays, setNDays] = useState<number>(4);
  const [netBuy, setNetBuy] = useState<boolean>(true);
  const [selectedBrokerCodes, setSelectedBrokerCodes] = useState<string[]>(['AK', 'BK']); // Default brokers
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
      setError('Number of days must be greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);
    setScreenerResults([]);

    try {
      const brokerCodesParam = selectedBrokerCodes.join(',');
      const response = await fetch(
        `/api/broker-screener?brokerCodes=${brokerCodesParam}&nDays=${nDays}&netBuy=${netBuy}`
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
    setNetBuy(true);
    setSelectedBrokerCodes(['AK', 'BK']);
    setScreenerResults([]);
    setError(null);
    setLoading(false);
    setSortConfig({ column: 'dominant_percent', direction: 'desc' }); // Reset sort config
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

    const aValue = a[sortConfig.column];
    const bValue = b[sortConfig.column];

    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
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
        Mengidentifikasi saham yang aktif diperdagangkan oleh kombinasi broker pilihan di setiap hari dari EOD sampai N day.
      </p>

      <div className="screener-controls">
        <div className="screener-row">
          <div className="input-group compact-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
            <label htmlFor="nDays" className="input-label compact-label">EOD → N day</label>
            <input
              id="nDays"
              type="number"
              value={nDays}
              onChange={(e) => setNDays(parseInt(e.target.value))}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="1"
            />
          </div>

          <div className="input-group compact-group" style={{ flex: '0 0 120px', marginBottom: 0 }}>
            <label className="input-label compact-label">Net Buy</label>
            <label className="switch">
              <input type="checkbox" checked={netBuy} onChange={() => setNetBuy(!netBuy)} />
              <span className="slider round"></span>
            </label>
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
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('net_direction')}
                  >
                    Net Direction {getSortIndicator('net_direction')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('net_lot')}
                  >
                    Net Lot {getSortIndicator('net_lot')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('avg_per_day')}
                  >
                    Avg / Day {getSortIndicator('avg_per_day')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('dominant_broker')}
                  >
                    Dominant Broker {getSortIndicator('dominant_broker')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('dominant_percent')}
                  >
                    Dominant % {getSortIndicator('dominant_percent')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((item, index) => (
                  <tr key={item.symbol} style={{ borderBottom: index < sortedResults.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {item.symbol}
                      {item.stock_name && item.stock_name !== item.symbol && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.stock_name}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'left' }}>
                      <span style={{ color: item.net_direction === 'All Net Buy' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        • {item.net_direction}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatNumber(item.net_lot)}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatAvgPerDay(item.avg_per_day)}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'left' }}>{item.dominant_broker}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <span>{item.dominant_percent.toFixed(2)}%</span>
                        <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                          <div style={{ width: `${item.dominant_percent}%`, height: '100%', background: 'var(--accent-success)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}