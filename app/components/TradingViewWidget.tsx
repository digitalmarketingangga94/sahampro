'use client';

import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface TradingViewWidgetProps {
  symbol: string;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <AdvancedRealTimeChart 
        theme="dark" 
        autosize 
        symbol={`IDX:${symbol}`} // Assuming IDX for Indonesian stocks
        interval="D"
        timezone="Asia/Jakarta"
        style="1"
        locale="en"
        toolbar_bg="#f1f3f6"
        enable_publishing={false}
        hide_side_toolbar={false}
        allow_symbol_change={true}
        save_image={false}
        container_id="tradingview_chart"
      />
    </div>
  );
}