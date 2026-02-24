'use client';

import { useState, useEffect } from 'react';
import type { EmitenInfoResponse } from '@/lib/types';
import { LineChart, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';

interface IdxEnergyDetailCardProps {
  symbol: string;
}

const formatNumber = (num: number | string | undefined, decimals: number = 0): string => {
  if (num === undefined || num === null) return '-';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '-';
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatCompactNumber = (num: number | string | undefined): string => {
  if (num === undefined || num === null) return '-';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '-';
  const absNum = Math.abs(n);
  if (absNum >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (absNum >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (absNum >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (absNum >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID');
};

export default function IdxEnergyDetailCard({ symbol }: IdxEnergyDetailCardProps) {
  const [sectorData, setSectorData] = useState<EmitenInfoResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/idx-sector/${symbol}`);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch data for ${symbol}`);
        }
        setSectorData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching data for ${symbol}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorDetail();
  }, [symbol]);

  if (loading) {
    return (
      <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading IDX Sector data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--accent-warning)' }}>
        <p style={{ color: 'var(--accent-warning)' }}>❌ {error}</p>
      </div>
    );
  }

  if (!sectorData) {
    return (
      <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No data available for {symbol}.
      </div>
    );
  }

  const isPositive = sectorData.percentage >= 0;
  const changeColor = isPositive ? 'var(--accent-success)' : 'var(--accent-warning)';

  return (
    <div className="glass-card-static" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <LineChart size={36} color="var(--accent-primary)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
            {sectorData.name || symbol} ({symbol})
          </h3>
          <p style={{ fontSize: '0.0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {sectorData.sector} - {sectorData.sub_sector}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Current Price */}
        <div style={{ background: 'rgba(0, 123, 255, 0.05)', border: '1px solid rgba(0, 123, 255, 0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Index</p>
          <p style={{ fontSize: '2.2rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1' }}>
            {formatNumber(sectorData.price, 0)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: changeColor }}>
            {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {formatNumber(sectorData.change, 2)} ({formatNumber(sectorData.percentage, 2)}%)
            </span>
          </div>
        </div>

        {/* Volume */}
        <div style={{ background: 'rgba(40, 167, 69, 0.05)', border: '1px solid rgba(40, 167, 69, 0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Volume</p>
          <p style={{ fontSize: '2.2rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1' }}>
            {formatCompactNumber(sectorData.volume)}
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Avg: {formatCompactNumber(sectorData.average)}
          </div>
        </div>

        {/* Followers */}
        <div style={{ background: 'rgba(255, 193, 7, 0.05)', border: '1px solid rgba(255, 193, 7, 0.1)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Followers</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2.2rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1' }}>
            <Users size={28} color="var(--text-secondary)" />
            {formatNumber(sectorData.followers)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Last Updated: {sectorData.date} {sectorData.time}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Exchange</p>
          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{sectorData.exchange}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Country</p>
          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{sectorData.country}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Type</p>
          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{sectorData.type_company}</p>
        </div>
      </div>
    </div>
  );
}