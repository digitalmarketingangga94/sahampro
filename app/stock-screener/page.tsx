'use client';

import StockScreenerTable from '../components/StockScreenerTable';

export default function StockScreenerPage() {
  // Template ID for "Daily Net Foreign Flow ISSI" from your example
  const templateId = "5942071"; 
  const title = "Stock Screener (Daily Net Foreign Flow ISSI)";

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <StockScreenerTable templateId={templateId} title={title} />
    </div>
  );
}