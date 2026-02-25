'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { IdxSectorCompanyItem } from '@/lib/types';
import { Building2 } from 'lucide-react';

interface IdxSectorCompaniesCardProps {
  sectorName: string;
  sectorId: string;
  subsectorId: string;
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
  if (absNum >= 1_000) return `${(absNum / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID');
};

export default function IdxSectorCompaniesCard({ sectorName, sectorId, subsectorId }: IdxSectorCompaniesCardProps) {
  const [companies, setCompanies] = useState<IdxSectorCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/idx-sector-companies/${sectorId}/${subsectorId}`);
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || `Failed to fetch companies for ${sectorName}`);
        }
        setCompanies(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Error fetching companies for ${sectorName}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [sectorName, sectorId, subsectorId]);

  const handleCompanyClick = (symbol: string) => {
    router.push(`/?symbol=${symbol}`); // Navigate to the main analysis page
  };

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <Building2 size={24} color="var(--accent-primary)" />
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Companies in {sectorName} ({companies.length})
        </h3>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading companies...</p>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : companies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
          No companies found in this sector.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Symbol</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Name</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Price</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Change (%)</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Volume</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => {
                const isPositive = parseFloat(company.percent) >= 0;
                const changeColor = isPositive ? 'var(--accent-success)' : 'var(--accent-warning)';
                return (
                  <tr 
                    key={company.symbol} 
                    style={{ 
                      borderBottom: index < companies.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCompanyClick(company.symbol)}
                  >
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {company.symbol}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {company.icon_url && (
                          <img src={company.icon_url} alt={company.name} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                        )}
                        {company.name}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatNumber(company.last, 0)}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: changeColor }}>
                      {isPositive ? '+' : ''}{formatNumber(company.percent, 2)}%
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(company.volume)}</td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{formatCompactNumber(parseFloat(company.marketcap))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}