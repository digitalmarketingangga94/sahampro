'use client';

import { useSearchParams } from 'next/navigation';
import IdxSectorCompaniesCard from '../../components/IdxSectorCompaniesCard';

interface IdxSectorCompaniesPageProps {
  params: {
    sectorName: string;
  };
}

export default function IdxSectorCompaniesPage({ params }: IdxSectorCompaniesPageProps) {
  const searchParams = useSearchParams();
  const sectorId = searchParams.get('sectorId');
  const subsectorId = searchParams.get('subsectorId');
  const { sectorName } = params;

  if (!sectorId || !subsectorId) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', textAlign: 'center', color: 'var(--accent-warning)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Error: Missing Sector Information</h2>
        <p>Please navigate from the IDX Sector list to select a valid sector.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Saham di Sektor {decodeURIComponent(sectorName)}</h2>
      <IdxSectorCompaniesCard 
        sectorName={decodeURIComponent(sectorName)}
        sectorId={sectorId}
        subsectorId={subsectorId}
      />
    </div>
  );
}