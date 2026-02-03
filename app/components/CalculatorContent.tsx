'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Calculator from './Calculator';
import { getLatestTradingDate } from '@/lib/utils';

export default function CalculatorContent() {
  const searchParams = useSearchParams();
  const [selectedSymbolFromUrl, setSelectedSymbolFromUrl] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(getLatestTradingDate());
  const [toDate, setToDate] = useState(getLatestTradingDate());

  useEffect(() => {
    const symbolFromUrl = searchParams.get('symbol');
    if (symbolFromUrl) {
      setSelectedSymbolFromUrl(symbolFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
  };

  return (
    <Calculator
      selectedSymbolFromSidebar={selectedSymbolFromUrl} // Renamed prop for clarity
      fromDate={fromDate}
      toDate={toDate}
      onDateChange={handleDateChange}
    />
  );
}