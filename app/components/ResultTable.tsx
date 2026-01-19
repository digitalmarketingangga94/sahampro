'use client';

import type { MarketData, CalculatedData } from '@/lib/types';

interface ResultTableProps {
  marketData: MarketData;
  calculated: CalculatedData;
}

export default function ResultTable({ marketData, calculated }: ResultTableProps) {
  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';

  return (
    <div className="grid grid-2">
      {/* Market Data */}
      <div className="glass-card">
        <h3>📊 Market Data</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <DataRow label="Harga" value={`Rp ${formatNumber(marketData.harga)}`} />
          <DataRow label="ARA (Offer Teratas)" value={`Rp ${formatNumber(marketData.offerTeratas)}`} />
          <DataRow label="ARB (Bid Terbawah)" value={`Rp ${formatNumber(marketData.bidTerbawah)}`} />
          <DataRow label="Fraksi" value={formatNumber(marketData.fraksi)} />
          <DataRow label="Total Bid" value={formatNumber(marketData.totalBid / 100)} />
          <DataRow label="Total Offer" value={formatNumber(marketData.totalOffer / 100)} />
        </div>
      </div>

      {/* Calculated Data */}
      <div className="glass-card">
        <h3>🧮 Calculations</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <DataRow label="Total Papan" value={formatNumber(calculated.totalPapan)} />
          <DataRow label="Rata² Bid/Offer" value={formatNumber(calculated.rataRataBidOfer)} />
          <DataRow label="a (5% dari rata² bandar)" value={formatNumber(calculated.a)} />
          <DataRow label="p (Barang/Rata² Bid Offer)" value={formatNumber(calculated.p)} />
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: '600' }}>{value}</span>
    </div>
  );
}
