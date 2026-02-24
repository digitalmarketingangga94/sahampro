'use client';

import IdxSectorCard from '../components/IdxSectorCard';

export default function IdxSectorPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>🏛️ IDX Sector List</h2>
      <IdxSectorCard />
    </div>
  );
}