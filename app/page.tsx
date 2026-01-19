'use client';


import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Calculator from './components/Calculator';


function HomeContent() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const stock = searchParams.get('stock');
    if (stock) setSelectedStock(stock);
  }, [searchParams]);

  return (
    <div className="app-layout">
      <div className="app-main">
        <Calculator selectedStock={selectedStock} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

