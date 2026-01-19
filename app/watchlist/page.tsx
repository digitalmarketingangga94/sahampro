'use client';

import dynamic from "next/dynamic";

const Watchlist = dynamic(() => import("../components/Watchlist"), { ssr: false });

export default function WatchlistPage() {
  return <Watchlist />;
}
