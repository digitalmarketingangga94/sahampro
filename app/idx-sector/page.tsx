'use client';

import IdxIndexListCard from '../components/IdxIndexListCard';

export default function IdxSectorPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🏛️ IDX Indices</h2>
      <IdxIndexListCard />
    </div>
  );
}