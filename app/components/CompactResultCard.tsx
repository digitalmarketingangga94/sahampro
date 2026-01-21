'use client';

import type { StockAnalysisResult } from '@/lib/types';

interface CompactResultCardProps {
  result: StockAnalysisResult;
  onCopyText?: () => void;
  onCopyImage?: () => void;
  copiedText?: boolean;
  copiedImage?: boolean;
}

export default function CompactResultCard({ 
  result, 
  onCopyText, 
  onCopyImage, 
  copiedText, 
  copiedImage 
}: CompactResultCardProps) {
  const { input, stockbitData, marketData, calculated } = result;

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';
  
  const calculateGain = (target: number) => {
    const gain = ((target - marketData.harga) / marketData.harga) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(2)}`;
  };

  return (
    <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-color">
        <div className="flex items-start gap-4">
          <div>
            <div className="text-lg font-bold text-accent-primary">+ {input.emiten.toUpperCase()}</div>
            {result.sector && (
              <div className="text-xs text-text-muted mt-0.5">
                {result.sector}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-1 opacity-80">
            RSY
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {input.fromDate} — {input.toDate}
          </div>
        </div>
      </div>

      {/* Top Broker Section */}
      <div className="mb-4 pb-4 border-b border-border-color">
        <div className="text-sm font-semibold text-text-primary mb-2">Top Broker</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Bandar</span>
            <span className="font-semibold text-accent-primary">{stockbitData.bandar}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Barang</span>
            <span className="font-semibold text-text-primary">{formatNumber(stockbitData.barangBandar)} lot</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Avg Harga</span>
            <span className="font-semibold text-text-primary">Rp {formatNumber(stockbitData.rataRataBandar)}</span>
            {stockbitData.rataRataBandar && marketData.harga && stockbitData.rataRataBandar < marketData.harga && (
              <span className="text-xs text-text-muted mt-0.5">
                {marketData.harga >= stockbitData.rataRataBandar ? '+' : ''}{(((marketData.harga - stockbitData.rataRataBandar) / stockbitData.rataRataBandar) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      <div className="mb-4 pb-4 border-b border-border-color">
        <div className="text-sm font-semibold text-text-primary mb-2">Market Data</div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Harga</span>
            <span className="font-semibold text-text-primary">Rp {formatNumber(marketData.harga)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Offer Max</span>
            <span className="font-semibold text-text-primary">Rp {formatNumber(marketData.offerTeratas)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Bid Min</span>
            <span className="font-semibold text-text-primary">Rp {formatNumber(marketData.bidTerbawah)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm mt-3">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Fraksi</span>
            <span className="font-semibold text-text-primary">{formatNumber(marketData.fraksi)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Total Bid</span>
            <span className="font-semibold text-text-primary">{formatNumber(marketData.totalBid / 100)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Total Offer</span>
            <span className="font-semibold text-text-primary">{formatNumber(marketData.totalOffer / 100)}</span>
          </div>
        </div>
      </div>

      {/* Calculations Section */}
      <div className="mb-4 pb-4 border-b border-border-color">
        <div className="text-sm font-semibold text-text-primary mb-2">Calculations</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Total Papan</span>
            <span className="font-semibold text-text-primary">{formatNumber(calculated.totalPapan)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">Rata² Bid/Offer</span>
            <span className="font-semibold text-text-primary">{formatNumber(calculated.rataRataBidOfer)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">a (5% avg bandar)</span>
            <span className="font-semibold text-text-primary">{formatNumber(calculated.a)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-xs">p (Brg/Avg)</span>
            <span className="font-semibold text-text-primary">{formatNumber(calculated.p)}</span>
          </div>
        </div>
      </div>

      {/* Target Section */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-text-primary mb-2">Target Prices</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col p-3 bg-gradient-success/[0.1] rounded-lg border border-accent-success/[0.3]">
            <span className="text-text-muted text-xs">Target Realistis</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-accent-success">{calculated.targetRealistis1}</span>
              <span className="text-xs text-text-secondary">{calculateGain(calculated.targetRealistis1)}%</span>
            </div>
          </div>
          <div className="flex flex-col p-3 bg-gradient-warning/[0.1] rounded-lg border border-accent-warning/[0.3]">
            <span className="text-text-muted text-xs">Target Max</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-accent-warning">{calculated.targetMax}</span>
              <span className="text-xs text-text-secondary">{calculateGain(calculated.targetMax)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-center gap-3 pt-4 border-t border-border-color">
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copiedText ? 'bg-accent-primary text-white' : 'bg-secondary text-text-secondary hover:bg-white/[0.1]'}`}
          onClick={onCopyText}
        >
          {copiedText ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
          {copiedText ? 'Copied Text' : 'Copy Text'}
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copiedImage ? 'bg-accent-primary text-white' : 'bg-secondary text-text-secondary hover:bg-white/[0.1]'}`}
          onClick={onCopyImage}
        >
          {copiedImage ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          )}
          {copiedImage ? 'Copied Image' : 'Copy Image'}
        </button>
      </div>
    </div>
  );
}