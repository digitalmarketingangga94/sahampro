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
    <div className="glass-card" style={{ 
      padding: '0', 
      overflow: 'hidden',
      height: '600px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: '#131722', // Matching TradingView's dark theme
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="m19 9-5 5-4-4-3 3"></path>
          </svg>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Advanced Chart
          </span>
        </div>
        
        <button 
          className="chartbit-btn"
          onClick={() => {
            const url = `https://stockbit.com/symbol/${ticker.toUpperCase()}/chartbit`;
            window.open(url, 'Chartbit', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,directories=no,resizable=yes,scrollbars=yes');
          }}
          style={{ padding: '6px 12px', fontSize: '0.7rem' }}
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
        className="tradingview-widget-container" 
        style={{ flex: 1, width: "100%" }}
      >
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  );
}
