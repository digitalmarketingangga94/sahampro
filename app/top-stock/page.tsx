'use client';

import TopStockTable from '../components/TopStockTable';
import { getLatestTradingDate } from '@/lib/utils';

export default function TopStockPage() {
  const today = getLatestTradingDate();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>📈 Top Stock ({today})</h2>
      <TopStockTable />
    </div>
  );
}