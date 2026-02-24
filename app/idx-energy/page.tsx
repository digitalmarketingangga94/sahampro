'use client';

import IdxIndexDetailCard from '../components/IdxIndexDetailCard';

export default function IdxEnergyPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>⚡ IDX Energy Detail</h2>
      <IdxIndexDetailCard symbol="IDXENERGY" />
    </div>
  );
}