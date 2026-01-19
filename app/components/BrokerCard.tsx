'use client';

import type { BrokerData } from '@/lib/types';

interface BrokerCardProps {
  data: BrokerData;
}

export default function BrokerCard({ data }: BrokerCardProps) {
  return (
    <div className="glass-card">
      <h3>🏆 Top Broker (Highest BVAL)</h3>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.5rem',
        marginTop: '1rem'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--gradient-primary)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: '700',
          boxShadow: 'var(--shadow-glow)'
        }}>
          {data.bandar}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Barang Bandar
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {data.barangBandar.toLocaleString()} lot
            </div>
          </div>
          
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Rata-rata Harga
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              Rp {data.rataRataBandar.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
