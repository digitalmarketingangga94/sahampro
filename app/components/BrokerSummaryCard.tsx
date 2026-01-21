'use client';

import type { BrokerSummaryData } from '@/lib/types';

interface BrokerSummaryCardProps {
  emiten: string;
  dateRange: string;
  brokerSummary: BrokerSummaryData;
  sector?: string;
}

export default function BrokerSummaryCard({ emiten, dateRange, brokerSummary, sector }: BrokerSummaryCardProps) {
  const { detector, topBuyers, topSellers } = brokerSummary;

  // Helper to format numbers
  const formatNumber = (num: number | string | undefined) => {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '-';
    return n.toLocaleString();
  };

  // Format value in Billions
  const formatBillions = (num: number) => {
    if (!num) return '-';
    const billions = num / 1_000_000_000;
    return billions.toFixed(1);
  };

  // Format value with K/M/B suffix
  const formatCompact = (valueStr: string) => {
    const num = parseFloat(valueStr);
    if (isNaN(num)) return '-';
    const absNum = Math.abs(num);
    if (absNum >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (absNum >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (absNum >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  };

  // Get badge class for Acc/Dist status
  const getAccDistClass = (status: string) => {
    if (!status) return 'bg-gray-600';
    const lower = status.toLowerCase();
    if (lower.includes('acc') && !lower.includes('small')) return 'bg-accent-success text-white';
    if (lower.includes('neutral')) return 'bg-gray-500 text-white';
    if (lower.includes('small dist')) return 'bg-yellow-500 text-white';
    if (lower.includes('dist')) return 'bg-accent-warning text-white';
    return 'bg-gray-600';
  };

  return (
    <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-color">
        <div>
          <div className="text-lg font-bold text-accent-primary">+ {emiten.toUpperCase()}</div>
          {sector && (
            <div className="text-xs text-text-muted mt-0.5">
              {sector}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-1 opacity-80">
            Broker Summary
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {dateRange}
          </div>
        </div>
      </div>

      {/* Top Broker Summary Table */}
      <div className="mb-4 pb-4 border-b border-border-color">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="py-2 font-normal"></th>
              <th className="py-2 font-normal text-right">Volume</th>
              <th className="py-2 font-normal text-right">%</th>
              <th className="py-2 font-normal text-right">Rp(B)</th>
              <th className="py-2 font-normal text-right">Acc/Dist</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 text-text-secondary">Top 1</td>
              <td className="py-1 text-right font-medium">{formatNumber(detector.top1?.vol)}</td>
              <td className="py-1 text-right font-medium">{detector.top1?.percent?.toFixed(1)}</td>
              <td className="py-1 text-right font-medium">{formatBillions(detector.top1?.amount)}</td>
              <td className="py-1 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${getAccDistClass(detector.top1?.accdist)}`}>{detector.top1?.accdist}</span></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Top 3</td>
              <td className="py-1 text-right font-medium">{formatNumber(detector.top3?.vol)}</td>
              <td className="py-1 text-right font-medium">{detector.top3?.percent?.toFixed(1)}</td>
              <td className="py-1 text-right font-medium">{formatBillions(detector.top3?.amount)}</td>
              <td className="py-1 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${getAccDistClass(detector.top3?.accdist)}`}>{detector.top3?.accdist}</span></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Top 5</td>
              <td className="py-1 text-right font-medium">{formatNumber(detector.top5?.vol)}</td>
              <td className="py-1 text-right font-medium">{detector.top5?.percent?.toFixed(1)}</td>
              <td className="py-1 text-right font-medium">{formatBillions(detector.top5?.amount)}</td>
              <td className="py-1 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${getAccDistClass(detector.top5?.accdist)}`}>{detector.top5?.accdist}</span></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Average</td>
              <td className="py-1 text-right font-medium">{formatNumber(detector.avg?.vol)}</td>
              <td className="py-1 text-right font-medium">{detector.avg?.percent?.toFixed(1)}</td>
              <td className="py-1 text-right font-medium">{formatBillions(detector.avg?.amount)}</td>
              <td className="py-1 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${getAccDistClass(detector.avg?.accdist)}`}>{detector.avg?.accdist}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Broker Statistics */}
      <div className="mb-4 pb-4 border-b border-border-color">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="py-2 font-normal"></th>
              <th className="py-2 font-normal text-right">Buyer</th>
              <th className="py-2 font-normal text-right">Seller</th>
              <th className="py-2 font-normal text-right">#</th>
              <th className="py-2 font-normal text-right">Acc/Dist</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 text-text-secondary">Broker</td>
              <td className="py-1 text-right font-medium">{detector.total_buyer}</td>
              <td className="py-1 text-right font-medium">{detector.total_seller}</td>
              <td className="py-1 text-right font-medium">{detector.number_broker_buysell}</td>
              <td className="py-1 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${getAccDistClass(detector.broker_accdist)}`}>{detector.broker_accdist}</span></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Net Volume</td>
              <td colSpan={3} className="py-1 text-right font-medium">{formatNumber(detector.volume)}</td>
              <td></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Net Value</td>
              <td colSpan={3} className="py-1 text-right font-medium">{formatBillions(detector.value)}B</td>
              <td></td>
            </tr>
            <tr>
              <td className="py-1 text-text-secondary">Average (Rp)</td>
              <td colSpan={3} className="py-1 text-right font-medium">{Math.round(detector.average)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top Brokers Detail */}
      <div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="py-2 font-normal">BY</th>
              <th className="py-2 font-normal text-right">B.val</th>
              <th className="py-2 font-normal text-right">B.lot</th>
              <th className="py-2 font-normal text-right">B.avg</th>
              <th className="py-2 font-normal">SL</th>
              <th className="py-2 font-normal text-right">S.val</th>
              <th className="py-2 font-normal text-right">S.lot</th>
              <th className="py-2 font-normal text-right">S.avg</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3].map((i) => {
              const buyer = topBuyers[i];
              const seller = topSellers[i];
              return (
                <tr key={i} className="border-t border-border-color/[0.5]">
                  <td className="py-1 text-accent-primary font-medium">{buyer?.netbs_broker_code || '-'}</td>
                  <td className="py-1 text-right">{buyer ? formatCompact(buyer.bval) : '-'}</td>
                  <td className="py-1 text-right">{buyer ? formatCompact(buyer.blot) : '-'}</td>
                  <td className="py-1 text-right">{buyer ? Math.round(parseFloat(buyer.netbs_buy_avg_price)) : '-'}</td>
                  <td className="py-1 text-accent-warning font-medium">{seller?.netbs_broker_code || '-'}</td>
                  <td className="py-1 text-right">{seller ? formatCompact(seller.sval.replace('-', '')) : '-'}</td>
                  <td className="py-1 text-right">{seller ? formatCompact(seller.slot.replace('-', '')) : '-'}</td>
                  <td className="py-1 text-right">{seller ? Math.round(parseFloat(seller.netbs_sell_avg_price)) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}