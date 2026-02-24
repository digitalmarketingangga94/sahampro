'use client';

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  interval = 'D',
  theme = 'dark', // Default to dark theme as seen in the image
  width = '100%',
  height = 600,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing widget to prevent duplicates on re-render
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": symbol,
        "interval": interval,
        "timezone": "Asia/Jakarta", // Assuming Indonesian timezone
        "theme": theme,
        "style": "1",
        "locale": "en", // You can change this to "id" for Indonesian locale if preferred
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      });
      containerRef.current.appendChild(script);
    }
  }, [symbol, interval, theme, width, height]);

  return (
    <div
      ref={containerRef}
      style={{ width, height, borderRadius: '12px', overflow: 'hidden' }}
      className="tradingview-widget-container"
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default TradingViewChart;