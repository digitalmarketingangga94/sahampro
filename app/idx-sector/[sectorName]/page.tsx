'use client';

import { useSearchParams } from 'next/navigation';
import IdxSectorCompaniesCard from '../../components/IdxSectorCompaniesCard';

// The validator expects params to be a Promise, even for client components in this specific case.
// We'll make the component async and await the params.
export default async function IdxSectorCompaniesPage({ params }: { params: Promise<{ sectorName: string }> }) {
  const searchParams = useSearchParams();
  const { sectorName } = await params; // Await the promise to extract sectorName
  const sectorId = searchParams.get('sectorId');
  const subsectorId = searchParams.get('subsectorId');

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