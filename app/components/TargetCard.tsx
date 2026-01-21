'use client';

interface TargetCardProps {
  emiten: string;
  sector?: string;
  currentPrice: number;
  targetRealistis: number;
  targetMax: number;
}

export default function TargetCard({ emiten, sector, currentPrice, targetRealistis, targetMax }: TargetCardProps) {
  const calculateGain = (target: number) => {
    const gain = ((target - currentPrice) / currentPrice) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(2)}`;
  };

  return (
    <div className="bg-card border border-border-color rounded-xl p-4 shadow-md">
      <h3 className="text-lg font-bold text-text-primary mb-4 pb-3 border-b border-border-color">🎯 Target Prices</h3>
      <div className="mt-2 mb-4">
        <div className="text-xl font-bold text-accent-primary">
          {emiten}
        </div>
        {sector && (
          <div className="text-sm text-text-muted mt-1">
            {sector}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Target Realistis */}
        <div className="bg-gradient-success rounded-xl p-8 text-center shadow-lg">
          <div className="text-sm font-semibold mb-2 uppercase tracking-wider">
            Target Realistis
          </div>
          <div className="text-5xl font-bold mb-2">
            {targetRealistis}
          </div>
          <div className="text-base opacity-90">
            {calculateGain(targetRealistis)}% gain
          </div>
        </div>

        {/* Target Max */}
        <div className="bg-gradient-warning rounded-xl p-8 text-center shadow-lg">
          <div className="text-sm font-semibold mb-2 uppercase tracking-wider">
            Target Max
          </div>
          <div className="text-5xl font-bold mb-2">
            {targetMax}
          </div>
          <div className="text-base opacity-90">
            {calculateGain(targetMax)}% gain
          </div>
        </div>
      </div>
    </div>
  );
}