'use client';

import { useEffect, useRef } from 'react';

interface PriceGraphProps {
  ticker: string;
}

export default function PriceGraph({ ticker }: PriceGraphProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clean up previous widget if any
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `IDX:${ticker.toUpperCase()}`,
      "interval": "D",
      "timezone": "Asia/Jakarta",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [ticker]);

  return (
    <div className="bg-card border border-border-color rounded-xl p-0 overflow-hidden shadow-md flex flex-col h-[600px]">
      <div className="flex items-center justify-between p-3 border-b border-border-color/[0.05] bg-black/[0.2]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Advanced Chart
          </span>
        </div>
        
        <button 
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary hover:bg-white/[0.1] text-text-secondary rounded-md transition-colors"
          onClick={() => {
            const url = `https://stockbit.com/symbol/${ticker.toUpperCase()}/chartbit`;
            window.open(url, 'Chartbit', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,directories=no,resizable=yes,scrollbars=yes');
          }}
          title="Open Stockbit Chartbit"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Chartbit
        </button>
      </div>
      <div 
        id="tradingview_widget"
        ref={container}
        className="flex-1 w-full" 
      >
        <div className="tradingview-widget-container__widget h-full w-full"></div>
      </div>
    </div>
  );
}