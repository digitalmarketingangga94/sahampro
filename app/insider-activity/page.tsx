'use client';

import InsiderActivityCard from '../components/InsiderActivityCard';
import { useState } from 'react';

export default function InsiderActivityPage() {
  const [emiten, setEmiten] = useState('BBCA'); // Default emiten for demonstration

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="glass-card-static" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Insider Activity Search</h2>
        <div className="input-group" style={{ maxWidth: '200px', marginBottom: '0' }}>
          <label htmlFor="emiten-input" className="input-label compact-label">Emiten</label>
          <input
            id="emiten-input"
            type="text"
            className="input-field compact-input"
            placeholder="e.g., BBCA"
            value={emiten}
            onChange={(e) => setEmiten(e.target.value.toUpperCase())}
          />
        </div>
      </div>
      
      {emiten && <InsiderActivityCard emiten={emiten} />}
    </div>
  );
}