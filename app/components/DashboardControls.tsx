'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface DashboardControlsProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  currentInterval: string;
  onIntervalChange: (interval: string) => void;
}

const timeframes = [
  { label: '1D', value: 'D' },
  { label: '4H', value: '240' }, // TradingView uses minutes for H intervals
  { label: '6H', value: '360' },
  { label: '8H', value: '480' },
];

export default function DashboardControls({
  currentSymbol,
  onSymbolChange,
  currentInterval,
  onIntervalChange,
}: DashboardControlsProps) {
  const [showSymbolSelect, setShowSymbolSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<{ code: string; name: string }[]>([]);
  const symbolSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/search-stocks?keyword=${debouncedSearchTerm}&limit=10`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSearchResults(json.data.map((item: any) => ({ code: item.code, name: item.name })));
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setSearchResults([]);
      }
    };
    fetchStocks();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (symbolSelectRef.current && !symbolSelectRef.current.contains(event.target as Node)) {
        setShowSymbolSelect(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setShowSymbolSelect(false);
    setSearchTerm('');
  };

  return (
    <div className="dashboard-controls-bar">
      <div className="control-group">
        <div className="symbol-select-wrapper" ref={symbolSelectRef}>
          <button
            className="symbol-select-button"
            onClick={() => setShowSymbolSelect(!showSymbolSelect)}
          >
            {currentSymbol} <ChevronDown size={16} />
          </button>
          {showSymbolSelect && (
            <div className="symbol-dropdown">
              <div className="search-input-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-options">
                {searchResults.length > 0 ? (
                  searchResults.map((stock) => (
                    <div
                      key={stock.code}
                      className="dropdown-option"
                      onClick={() => handleSymbolSelect(`IDX:${stock.code}`)} // Prefix with IDX:
                    >
                      {stock.code} - {stock.name}
                    </div>
                  ))
                ) : (
                  searchTerm.length >= 2 && (
                    <div className="dropdown-option disabled">No results</div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="timeframe-buttons">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              className={`timeframe-button ${currentInterval === tf.value ? 'active' : ''}`}
              onClick={() => onIntervalChange(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <button className="indicators-button">
          Indicators <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
}