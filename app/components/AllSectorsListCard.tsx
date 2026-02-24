'use client';

import { useState, useEffect } from 'react';

interface AllSectorsListCardProps {}

export default function AllSectorsListCard({}: AllSectorsListCardProps) {
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/sectors');
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch sectors');
        }
        setSectors(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching sectors');
      } finally {
        setLoading(false);
      }
    };

    fetchSectorsData();
  }, []);

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
        All IDX Sectors ({sectors.length})
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>#</th>
                <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Sector Name</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector, index) => (
                <tr key={sector} style={{ borderBottom: index < sectors.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}