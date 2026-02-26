'use client';

import { useState, useEffect, useRef } from 'react';
import { BROKERS, BrokerInfo } from '@/lib/brokers';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import type { BrokerForeignScreenerResultItem } from '@/lib/types';
import { Search, ChevronDown, Play, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BrokerForeignScreenerCardProps {}

const formatValueCompact = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absValue >= 1_000_000_000) return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`;
  if (absValue >= 1_000_000) return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${sign}${(absValue / 1_000).toFixed(1)}K`;
  return `${sign}${absValue.toLocaleString('id-ID')}`;
};

const formatPrice = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-';
  return Math.round(num).toLocaleString('id-ID');
};

type SortColumn = 'symbol' | 'net_foreign_buy_value' | 'smart_money_net_value' | 'avg_price_smart_money' | 'last_price' | 'change_percentage';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  column: SortColumn | null;
  direction: SortDirection;
}

export default function BrokerForeignScreenerCard({}: BrokerForeignScreenerCardProps) {
  const [nDays, setNDays] = useState<number>(5);
  const [minNetForeignValue, setMinNetForeignValue] = useState<number>(1_000_000_000); // Default 1B
  const [minSmartMoneyNetValue, setMinSmartMoneyNetValue] = useState<number>(500_000_000); // Default 500M
  const [selectedSmartMoneyBrokers, setSelectedSmartMoneyBrokers] = useState<string[]>([]); // Changed default to empty array
  const [screenerResults, setScreenerResults] = useState<BrokerForeignScreenerResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBrokerSelect, setShowBrokerSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const brokerSelectRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'smart_money_net_value', direction: 'desc' });
  const router = useRouter();

  // Modified to include both 'Smartmoney' and 'Foreign' broker types
  const smartMoneyBrokerOptions = Object.values(BROKERS).filter(b => b.type === 'Smartmoney' || b.type === 'Foreign').sort((a, b) => a.code.localeCompare(b.code));

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

  const handleRunScreener = async () => {
    if (selectedSmartMoneyBrokers.length === 0) {
      setError('Please select at least one Smart Money or Foreign broker.');
      return;
    }
    if (nDays <= 0) {
      setError('Number of days must be greater than 0.');
      return;
    }
    if (minNetForeignValue < 0 || minSmartMoneyNetValue < 0) {
      setError('Minimum values cannot be negative.');
      return;
    }

    setLoading(true);
    setError(null);
    setScreenerResults([]);

    try {
      const brokerCodesParam = selectedSmartMoneyBrokers.join(',');
      const response = await fetch(
        `/api/broker-foreign-screener?nDays=${nDays}&minNetForeignValue=${minNetForeignValue}&minSmartMoneyNetValue=${minSmartMoneyNetValue}&smartMoneyBrokerCodes=${brokerCodesParam}`
      );
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch broker foreign screener results');
      }
      
      setScreenerResults(json.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNDays(5);
    setMinNetForeignValue(1_000_000_000);
    setMinSmartMoneyNetValue(500_000_000);
    setSelectedSmartMoneyBrokers([]); // Changed reset default to empty array
    setScreenerResults([]);
    setError(null);
    setLoading(false);
    setSortConfig({ column: 'smart_money_net_value', direction: 'desc' });
  };

  const toggleBrokerSelection = (code: string) => {
    setSelectedSmartMoneyBrokers(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code) 
        : [...prev, code]
    );
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
      case 'net_foreign_buy_value':
        aValue = a.net_foreign_buy_value;
        bValue = b.net_foreign_buy_value;
        break;
      case 'smart_money_net_value':
        aValue = a.smart_money_net_value;
        bValue = b.smart_money_net_value;
        break;
      case 'avg_price_smart_money':
        aValue = a.avg_price_smart_money || 0;
        bValue = b.avg_price_smart_money || 0;
        break;
      case 'last_price':
        aValue = a.last_price || 0;
        bValue = b.last_price || 0;
        break;
      case 'change_percentage':
        aValue = a.change_percentage || 0;
        bValue = b.change_percentage || 0;
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

  const filteredBrokerOptions = smartMoneyBrokerOptions.filter(broker => 
    broker.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSymbolClick = (symbol: string) => {
    router.push(`/?symbol=${symbol}`); // Navigate to the main analysis page
  };

  const showDominantColumns = selectedSmartMoneyBrokers.length > 1;

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal', marginBottom: '1rem' }}>
        NET FOREIGN ACCUMULATION BY SMART MONEY
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Identifies stocks with significant Net Foreign Buy that are also being accumulated by selected Smart Money brokers over a specified period.
      </p>

      <div className="screener-controls">
        <div className="screener-row">
          <div className="input-group compact-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
            <label htmlFor="nDays" className="input-label compact-label">Lookback Days</label>
            <input
              id="nDays"
              type="number"
              value={nDays}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNDays(isNaN(value) ? 1 : value);
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'center' }}
              min="1"
            />
          </div>

          <div className="input-group compact-group" style={{ flex: '0 0 200px', marginBottom: 0 }}>
            <label htmlFor="minNetForeignValue" className="input-label compact-label">Min Net Foreign Value (IDR)</label>
            <input
              id="minNetForeignValue"
              type="number"
              value={minNetForeignValue}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setMinNetForeignValue(isNaN(value) ? 0 : value);
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'right' }}
              min="0"
            />
          </div>

          <div className="input-group compact-group" style={{ flex: '0 0 200px', marginBottom: 0 }}>
            <label htmlFor="minSmartMoneyNetValue" className="input-label compact-label">Min Smart Money Net Value (IDR)</label>
            <input
              id="minSmartMoneyNetValue"
              type="number"
              value={minSmartMoneyNetValue}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setMinSmartMoneyNetValue(isNaN(value) ? 0 : value);
              }}
              className="input-field compact-input"
              style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', height: '32px', textAlign: 'right' }}
              min="0"
            />
          </div>

          {/* Multi-select Broker Dropdown */}
          <div style={{ position: 'relative', flex: '1 1 250px', minWidth: '200px' }} ref={brokerSelectRef}>
            <label className="input-label compact-label">Smart Money & Foreign Brokers</label>
            <button
              type="button"
              className="input-field compact-input"
              onClick={() => setShowBrokerSelect(!showBrokerSelect)}
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
              <span>
                {selectedSmartMoneyBrokers.length > 0 
                  ? selectedSmartMoneyBrokers.map(code => BROKERS[code]?.name || code).join(', ') 
                  : 'Select Brokers'}
              </span>
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
                        color: selectedSmartMoneyBrokers.includes(broker.code) ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: selectedSmartMoneyBrokers.includes(broker.code) ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                        transition: 'background 0.1s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSmartMoneyBrokers.includes(broker.code)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                      {broker.code} - {broker.name}
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

        <div className="screener-actions">
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
            Result Data ({sortedResults.length} stocks found)
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Lookback: {nDays} days • Min Net Foreign: {formatValueCompact(minNetForeignValue)} • Min Smart Money: {formatValueCompact(minSmartMoneyNetValue)}
            </span>
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
                minWidth: showDominantColumns ? '1200px' : '800px' // Adjust minWidth based on columns
              }}
            >
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
                    onClick={() => handleSort('last_price')}
                  >
                    Price {getSortIndicator('last_price')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('change_percentage')}
                  >
                    Change (%) {getSortIndicator('change_percentage')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('net_foreign_buy_value')}
                  >
                    Net Foreign Buy {getSortIndicator('net_foreign_buy_value')}
                  </th>
                  <th 
                    style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleSort('smart_money_net_value')}
                  >
                    Smart Money Net Buy {getSortIndicator('smart_money_net_value')}
                  </th>
                  {showDominantColumns && (
                    <>
                      <th 
                        style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}
                      >
                        SM Brokers
                      </th>
                      <th 
                        style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        onClick={() => handleSort('avg_price_smart_money')}
                      >
                        SM Avg Price {getSortIndicator('avg_price_smart_money')}
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>
                {sortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={showDominantColumns ? 7 : 5} style={{ textAlign: 'center', padding: '1rem' }}>
                      No Data
                    </td>
                  </tr>
                ) : (
                  sortedResults.map((item, index) => (
                    <tr
                      key={item.symbol}
                      style={{
                        borderBottom:
                          index < sortedResults.length - 1
                            ? '1px solid rgba(255,255,255,0.03)'
                            : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSymbolClick(item.symbol)}
                    >
                      <td
                        style={{
                          padding: '0.5rem 0.25rem',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          textAlign: 'left'
                        }}
                      >
                        {item.symbol}
                        {item.stock_name &&
                          item.stock_name !== item.symbol && (
                            <div
                              style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {item.stock_name}
                            </div>
                          )}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                        {formatPrice(item.last_price)}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: (item.change_percentage || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {item.change_percentage !== undefined ? `${item.change_percentage >= 0 ? '+' : ''}${item.change_percentage.toFixed(2)}%` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: (item.net_foreign_buy_value || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {formatValueCompact(item.net_foreign_buy_value)}
                      </td>
                      <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: (item.smart_money_net_value || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {formatValueCompact(item.smart_money_net_value)}
                      </td>
                      {showDominantColumns && (
                        <>
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            {item.smart_money_brokers_involved.join(', ') || '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                            {formatPrice(item.avg_price_smart_money)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}