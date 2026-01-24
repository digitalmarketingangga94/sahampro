'use client';

import HotStockTable from '../components/HotStockTable';

export default function HotStockPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🔥 Hot Stock (Top Gainer)</h2>
      <HotStockTable />
    </div>
  );
}