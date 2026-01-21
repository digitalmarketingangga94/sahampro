import MarketMoversTable from '../components/MarketMoversTable';

export default function DashboardPage() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>Market Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <MarketMoversTable type="gainer" title="Top Gainer" limit={30} />
        <MarketMoversTable type="loser" title="Top Loser" limit={30} />
        <MarketMoversTable type="value" title="Top Value" limit={30} />
        <MarketMoversTable type="volume" title="Top Volume" limit={30} />
        <MarketMoversTable type="frequency" title="Top Frequency" limit={30} />
      </div>
    </div>
  );
}