'use client';

import Link from 'next/link';
import { LineChart } from 'lucide-react';

export default function IdxIndexListCard() {
  const idxIndices = [
    { symbol: 'IDXTRANS', name: 'IDX Transportation' },
    { symbol: 'IDXBASIC', name: 'IDX Basic Materials' },
    { symbol: 'IDXFINANCE', name: 'IDX Financials' },
    { symbol: 'IDXNONCYC', name: 'IDX Non-Cyclicals' },
    { symbol: 'IDXTECHNO', name: 'IDX Technology' },
    { symbol: 'IDXENERGY', name: 'IDX Energy' },
    { symbol: 'IDXHEALTH', name: 'IDX Healthcare' },
    { symbol: 'IDXINDUST', name: 'IDX Industrials' },
    { symbol: 'IDXPROPERT', name: 'IDX Properties & Real Estate' },
    { symbol: 'IDXCICLIC', name: 'IDX Cyclicals' },
    { symbol: 'IDXINFRA', name: 'IDX Infrastructure' },
  ];

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
        Daftar Indeks IDX
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>#</th>
              <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Simbol Indeks</th>
              <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Nama Indeks</th>
              <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {idxIndices.map((index, i) => (
              <tr key={index.symbol} style={{ borderBottom: i < idxIndices.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{index.symbol}</td>
                <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-primary)' }}>{index.name}</td>
                <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                  <Link href={`/idx-sector/${index.symbol}`} passHref>
                    <button 
                      className="btn btn-primary compact-btn"
                      style={{ padding: '00.4rem 0.8rem', fontSize: '0.7rem', minWidth: 'unset' }}
                    >
                      <LineChart size={14} /> Detail
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}