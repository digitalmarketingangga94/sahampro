'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import InputForm from './InputForm';
import CompactResultCard from './CompactResultCard';
import BrokerSummaryCard from './BrokerSummaryCard';
import KeyStatsCard from './KeyStatsCard';
import AgentStoryCard from './AgentStoryCard';
import PriceGraph from './PriceGraph';
import BrokerFlowCard from './BrokerFlowCard';
import InsiderActivityCard from './InsiderActivityCard'; // New import
import GrahamFormulaCard from './GrahamFormulaCard'; // New import
import html2canvas from 'html2canvas';
import type { StockInput, StockAnalysisResult, KeyStatsData, AgentStoryResult } from '@/lib/types';
import { getLatestTradingDate } from '@/lib/utils'; // Updated import

interface CalculatorProps {
  selectedSymbolFromSidebar?: string | null; // New prop
}

// Helper function to format the result data for copying
function formatResultForCopy(result: StockAnalysisResult): string {
  const { input, stockbitData, marketData, calculated } = result;

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';

  const calculateGain = (target: number) => {
    const gain = ((target - marketData.harga) / marketData.harga) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(2)}`;
  };

  const lines = [
    `RSY: ${input.emiten.toUpperCase()}`,
    `${input.fromDate} s/d ${input.toDate}`,
    ``,
    `TOP BROKER`,
    `Broker: ${stockbitData.bandar}`,
    `∑ Brg: ${formatNumber(stockbitData.barangBandar)} lot`,
    `Avg Harga: Rp ${formatNumber(stockbitData.rataRataBandar)}`,
    ``,
    `MARKET DATA`,
    `Harga: Rp ${formatNumber(marketData.harga)}`,
    `Offer Max: Rp ${formatNumber(marketData.offerTeratas)}`,
    `Bid Min: Rp ${formatNumber(marketData.bidTerbawah)}`,
    `Fraksi: ${formatNumber(marketData.fraksi)}`,
    `∑ Bid: ${formatNumber(marketData.totalBid / 100)}`,
    `∑ Offer: ${formatNumber(marketData.totalOffer / 100)}`,
    ``,
    `CALCULATIONS`,
    `∑ Papan: ${formatNumber(calculated.totalPapan)}`,
    `Avg Bid-Offer: ${formatNumber(calculated.rataRataBidOfer)}`,
    `a (5% avg bandar): ${formatNumber(calculated.a)}`,
    `p (Brg/Avg Bid-Offer): ${formatNumber(calculated.p)}`,
    ``,
    `Target 1: ${calculated.targetRealistis1} (${calculateGain(calculated.targetRealistis1)}%)`,
    `Target 2: ${calculated.targetMax} (${calculateGain(calculated.targetMax)}%)`,
  ];

  return lines.join('\n');
}

export default function Calculator({ selectedSymbolFromSidebar }: CalculatorProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [keyStats, setKeyStats] = useState<KeyStatsData | null>(null);

  // Agent Story state
  const [agentStories, setAgentStories] = useState<AgentStoryResult[]>([]);
  const [storyStatus, setStoryStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'error'>('idle');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Date state lifted from InputForm
  const [fromDate, setFromDate] = useState(getLatestTradingDate());
  const [toDate, setToDate] = useState(getLatestTradingDate());

  // State for the current emiten being analyzed, can be updated by URL or sidebar
  const [currentEmiten, setCurrentEmiten] = useState<string>(searchParams.get('symbol') || 'SOCI');

  // Effect to handle initial symbol from URL or sidebar, and trigger analysis
  useEffect(() => {
    const symbolFromUrl = searchParams.get('symbol');
    let newEmitenValue = symbolFromUrl ? symbolFromUrl.toUpperCase() : currentEmiten;

    // Prioritize sidebar selection if present
    if (selectedSymbolFromSidebar) {
      newEmitenValue = selectedSymbolFromSidebar.toUpperCase();
    }

    // Only update if the value is actually different
    if (newEmitenValue !== currentEmiten) {
      setCurrentEmiten(newEmitenValue);
      handleSubmit({ emiten: newEmitenValue, fromDate, toDate });
    }
  }, [searchParams, selectedSymbolFromSidebar, currentEmiten, fromDate, toDate]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (data: StockInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAgentStories([]);
    setStoryStatus('idle');
    setKeyStats(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze stock');
      }

      setResult(json.data);

      // Fetch KeyStats after getting result
      try {
        const keyStatsRes = await fetch(`/api/keystats?emiten=${data.emiten}`);
        const keyStatsJson = await keyStatsRes.json();
        if (keyStatsJson.success) {
          setKeyStats(keyStatsJson.data);
        }
      } catch (keyStatsErr) {
        console.error('Failed to fetch key stats:', keyStatsErr);
      }

      // Fetch existing Agent Story if available
      try {
        const storyRes = await fetch(`/api/analyze-story?emiten=${data.emiten}`);
        const storyJson = await storyRes.json();
        if (storyJson.success && storyJson.data && Array.isArray(storyJson.data)) {
          setAgentStories(storyJson.data);
          const latestStory = storyJson.data[0];
          if (latestStory.status === 'completed') {
            setStoryStatus('completed');
          } else if (latestStory.status === 'processing' || latestStory.status === 'pending') {
            // Re-trigger polling if it was still in progress
            handleAnalyzeStory(true);
          }
        }
      } catch (storyErr) {
        console.error('Failed to fetch existing agent story:', storyErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
  };

  const handleAnalyzeStory = async (isResuming: boolean = false) => {
    if (!result) return;

    const emiten = result.input.emiten.toUpperCase();
    setStoryStatus('pending');

    if (!isResuming) {
      // Don't clear existing stories when starting a new one, 
      // just add a placeholder or let the API update handle it
    }

    try {
      // Trigger background analysis
      const response = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emiten,
          keyStats: keyStats // Pass the current keyStats data
        })
      });

      let data;
      if (!response.ok) {
        const errorBody = await response.text();
        try {
          data = JSON.parse(errorBody);
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}. Response: ${errorBody.substring(0, 200)}...`);
        }
        throw new Error(data.error || 'Failed to start analysis');
      }
      data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Start polling for status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/analyze-story?emiten=${emiten}`);
          let statusData;
          if (!statusRes.ok) {
            const errorBody = await statusRes.text();
            try {
              statusData = JSON.parse(errorBody);
            } catch {
              // If it's not JSON, it's likely an HTML error page
              console.error('Polling received non-JSON response:', errorBody);
              setStoryStatus('error');
              setError(`Polling server error: ${statusRes.status} ${statusRes.statusText}. Check Netlify function logs.`);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              return; // Stop polling
            }
            throw new Error(statusData.error || 'Polling failed');
          }
          statusData = await statusRes.json();

          if (statusData.success && statusData.data && Array.isArray(statusData.data)) {
            const stories = statusData.data;
            setAgentStories(stories);

            const currentProcessing = stories[0]; // The one we just triggered is usually the first (desc order)
            if (currentProcessing.status === 'completed') {
              setStoryStatus('completed');
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            } else if (currentProcessing.status === 'error') {
              setStoryStatus('error');
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            } else if (currentProcessing.status === 'processing') {
              setStoryStatus('processing');
            }
          } else if (!statusData.success && statusData.error) {
            // Handle explicit error from the API route
            setStoryStatus('error');
            setError(statusData.error);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
          setStoryStatus('error');
          setError(pollErr instanceof Error ? pollErr.message : 'An unknown polling error occurred');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      }, 5000);

    } catch (err) {
      console.error('Failed to start analysis:', err);
      setStoryStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred while starting analysis');
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      const formattedText = formatResultForCopy(result);
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyImage = async () => {
    const cardElement = document.getElementById('compact-result-card-container');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
      });

      // Wrap toBlob in a Promise to keep the async chain active for Safari's strict user-gesture checks
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('Failed to generate image blob');

      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed:', err);

        // 1. Fallback for iOS Safari / Mobile: Web Share API
        // This opens the native share sheet which is often preferred on mobile
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${result?.input.emiten || 'stock'}-analysis.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Stock Analysis Result',
            });
            return;
          }
        }

        // 2. If all else fails
        throw err;
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError('Failed to copy image. Try taking a screenshot manually.');
    }
  };

  // Extract EPS value from KeyStats
  let epsValue: number | null = null;
  if (keyStats?.perShare) {
    const ttmEpsItem = keyStats.perShare.find(item => item.name === 'Current EPS (TTM)');
    const annualEpsItem = keyStats.perShare.find(item => item.name === 'Current EPS (Annualised)');

    if (ttmEpsItem && ttmEpsItem.value) {
      epsValue = parseFloat(ttmEpsItem.value);
    } else if (annualEpsItem && annualEpsItem.value) {
      epsValue = parseFloat(annualEpsItem.value);
    }
  }

  return (
    <div className="container">
      <InputForm
        onSubmit={handleSubmit}
        loading={loading}
        initialEmiten={currentEmiten}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={handleDateChange}
        onCopyText={handleCopy}
        onCopyImage={handleCopyImage}
        onAnalyzeAI={() => handleAnalyzeStory()}
        copiedText={copied}
        copiedImage={copiedImage}
        storyStatus={storyStatus}
        hasResult={!!result}
      />

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="text-secondary mt-2">Fetching data from Stockbit...</p>
        </div>
      )}

      {error && (
        <div className="glass-card mt-4" style={{
          background: 'rgba(245, 87, 108, 0.1)',
          borderColor: 'var(--accent-warning)'
        }}>
          <h3>❌ Error</h3>
          <p style={{ color: 'var(--accent-warning)' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          {result.isFromHistory && result.historyDate && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              color: '#ffc107',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                Data broker live tidak tersedia. Menampilkan data history terakhir dari tanggal
                <strong style={{ marginLeft: '4px', color: '#ffca2c' }}>
                  {new Date(result.historyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>
          )}

          {/* Side-by-side Cards Container */}
          <div className="cards-row">
            {/* Left Column: Compact Result */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div id="compact-result-card-container">
                <CompactResultCard
                  result={result}
                  onCopyText={handleCopy}
                  onCopyImage={handleCopyImage}
                  copiedText={copied}
                  copiedImage={copiedImage}
                />
              </div>


            </div>

            {/* Right Column: Broker Summary */}
            {result.brokerSummary && (
              <BrokerSummaryCard
                emiten={result.input.emiten}
                dateRange={`${result.input.fromDate} — ${result.input.toDate}`}
                brokerSummary={result.brokerSummary}
                sector={result.sector}
              />
            )}

            {/* KeyStats Card */}
            {keyStats && (
              <KeyStatsCard
                emiten={result.input.emiten}
                keyStats={keyStats}
              />
            )}
          </div>

          {/* Graham Formula Card */}
          {result && keyStats && epsValue !== null && (
            <div style={{ gridColumn: '1 / -1', width: '100%', marginTop: '1.5rem' }}>
              <GrahamFormulaCard
                emiten={result.input.emiten}
                currentPrice={result.marketData.harga}
                eps={epsValue}
              />
            </div>
          )}

          {/* Price Graph Section */}
          <div style={{ gridColumn: '1 / -1', width: '100%', marginTop: '1.5rem' }}>
            <PriceGraph ticker={result.input.emiten} />
          </div>

          {/* Broker Flow Section */}
          <div style={{ gridColumn: '1 / -1', width: '100%', marginTop: '1.5rem' }}>
            <BrokerFlowCard emiten={result.input.emiten} />
          </div>

          {/* Insider Activity Section - Full Width */}
          <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', width: '100%' }}>
            <InsiderActivityCard emiten={result.input.emiten} />
          </div>

          {/* Agent Story Section - Full Width */}
          <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', width: '100%' }}> {/* Adjusted margin-top */}
            {(agentStories.length > 0 || storyStatus !== 'idle') && (
              <AgentStoryCard
                stories={agentStories}
                status={storyStatus}
                onRetry={() => handleAnalyzeStory()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}