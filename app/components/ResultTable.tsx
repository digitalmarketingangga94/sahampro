'use client';

import type { MarketData, CalculatedData } from '@/lib/types';

interface ResultTableProps {
  marketData: MarketData;
  calculated: CalculatedData;
}

export default function ResultTable({ marketData, calculated }: ResultTableProps) {
  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Market Data */}
      <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border-color">📊 Market Data</h3>
        
        <div className="flex flex-col gap-3">
          <DataRow label="Harga" value={`Rp ${formatNumber(marketData.harga)}`} />
          <DataRow label="ARA (Offer Teratas)" value={`Rp ${formatNumber(marketData.offerTeratas)}`} />
          <DataRow label="ARB (Bid Terbawah)" value={`Rp ${formatNumber(marketData.bidTerbawah)}`} />
          <DataRow label="Fraksi" value={formatNumber(marketData.fraksi)} />
          <DataRow label="Total Bid" value={formatNumber(marketData.totalBid / 100)} />
          <DataRow label="Total Offer" value={formatNumber(marketData.totalOffer / 100)} />
        </div>
      </div>

      {/* Calculated Data */}
      <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
        <h3 className="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border-color">🧮 Calculations</h3>
        
        <div className="flex flex-col gap-3">
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
    <div className="flex justify-between items-center py-2 border-b border-border-color last:border-b-0">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="font-semibold text-text-primary text-sm">{value}</span>
    </div>
  );
}