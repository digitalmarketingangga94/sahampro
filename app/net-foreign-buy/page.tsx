'use client';

import MarketMoversTable from '../components/MarketMoversTable';

export default function NetForeignBuyPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>💰 Net Foreign Buy</h2>
      <MarketMoversTable type="net-foreign-buy" title="Top Net Foreign Buy" limit={50} />
    </div>
  );
}