'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { IdxSector, EmitenInfoResponse } from '@/lib/types';

interface IdxSectorGridCardProps {
  sector: IdxSector;
  data: EmitenInfoResponse['data'] | null;
}

const formatNumber = (num: number | string | undefined, decimals: number = 0): string => {
  if (num === undefined || num === null) return '-';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '-';
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export default function IdxSectorGridCard({ sector, data }: IdxSectorGridCardProps) {
  const isPositive = data && data.percentage >= 0;
  const changeColorClass = isPositive ? 'positive' : 'negative';

  return (
    <Link 
      href={`/idx-sector/${sector.name}?sectorId=${sector.parent}&subsectorId=${sector.id}`} 
      passHref 
      style={{ textDecoration: 'none' }}
    >
      <div className={`idx-sector-card ${changeColorClass}`}>
        <div className="idx-sector-card-header">
          <span className="idx-sector-name">{data?.name || sector.name}</span>
          {data && (isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />)}
        </div>
        {data ? (
          <div className="idx-sector-change">
            <span className="idx-sector-change-value">
              {isPositive ? '+' : ''}{formatNumber(data.change, 2)}
            </span>
            <span className="idx-sector-change-percent">
              ({isPositive ? '+' : ''}{formatNumber(data.percentage, 2)}%)
            </span>
          </div>
        ) : (
          <div className="idx-sector-change">
            <span className="idx-sector-change-value">-</span>
            <span className="idx-sector-change-percent">(-)</span>
          </div>
        )}
      </div>
    </Link>
  );
}