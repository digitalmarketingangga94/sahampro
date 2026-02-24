'use client';

import IdxEnergyDetailCard from '../components/IdxEnergyDetailCard';

export default function IdxEnergyPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>⚡ IDX Energy Detail</h2>
      <IdxEnergyDetailCard symbol="IDXENERGY" />
    </div>
  );
}