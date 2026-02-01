'use client';

import InsiderActivityCard from '../components/InsiderActivityCard';
// import { useState } from 'react'; // Removed useState as emiten is now managed by the card

export default function InsiderActivityPage() {
  // const [emiten, setEmiten] = useState('BBCA'); // Default emiten for demonstration - removed

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Removed the separate input card, InsiderActivityCard will handle its own emiten selection */}
      
      <InsiderActivityCard /> {/* No emiten prop needed here anymore */}
    </div>
  );
}