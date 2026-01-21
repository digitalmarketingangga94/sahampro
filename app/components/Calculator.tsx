'use client';

import { useState, useEffect, useRef } from 'react';
import InputForm from './InputForm';
import CompactResultCard from './CompactResultCard';
import BrokerSummaryCard from './BrokerSummaryCard';
import KeyStatsCard from './KeyStatsCard';
import AgentStoryCard from './AgentStoryCard';
import PriceGraph from './PriceGraph';
import BrokerFlowCard from './BrokerFlowCard';
import html2canvas from 'html2canvas';
import type { StockInput, StockAnalysisResult, KeyStatsData, AgentStoryResult } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';

interface CalculatorProps {
  selectedStock?: string | null;
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

export default function Calculator({ selectedStock }: CalculatorProps) {
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
  const [fromDate, setFromDate] = useState(getDefaultDate());
  const [toDate, setToDate] = useState(getDefaultDate());

  // Reset result and error when a new stock is selected from sidebar
  useEffect(() => {
    if (selectedStock) {
      setResult(null);
      setError(null);
      setAgentStories([]);
      setStoryStatus('idle');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Auto-analyze with current selected dates
      // This allows clicking watchlist items to RESPECT the date range selected by user
      handleSubmit({
        emiten: selectedStock,
        fromDate,
        toDate
      });
    }
  }, [selectedStock]);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle token refresh to auto-retry failed analysis
  useEffect(() => {
    const handleTokenRefresh = () => {
      console.log('Token refreshed event received in Calculator');
      // If there's an error that looks like a token issue, retry the last analysis
      if (error && (error.toLowerCase().includes('token') || error.toLowerCase().includes('401'))) {
        const emitenToRetry = selectedStock || result?.input.emiten;
        if (emitenToRetry) {
          console.log(`Retrying analysis for ${emitenToRetry}`);
          handleSubmit({
            emiten: emitenToRetry,
            fromDate,
            toDate
          });
        }
      }
    };

    window.addEventListener('token-refreshed', handleTokenRefresh);
    return () => window.removeEventListener('token-refreshed', handleTokenRefresh);
  }, [error, selectedStock, result, fromDate, toDate]);

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

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Start polling for status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/analyze-story?emiten=${emiten}`);
          const statusData = await statusRes.json();

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
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 5000);

    } catch (err) {
      console.error('Failed to start analysis:', err);
      setStoryStatus('error');
      // We don't necessarily want to setAgentStories to an error object if we have other stories
      // But for the sake of showing error in the card, we might need a workaround or specific error state in card
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

  return (
    <div className="container mx-auto px-4 py-8">
      <InputForm
        onSubmit={handleSubmit}
        loading={loading}
        initialEmiten={selectedStock}
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
        <div className="text-center mt-8">
          <div className="spinner w-8 h-8 mx-auto"></div>
          <p className="text-text-secondary mt-4">Fetching data from Stockbit...</p>
        </div>
      )}

      {error && (
        <div className="bg-accent-warning/[0.1] border border-accent-warning rounded-xl p-6 mt-8">
          <h3 className="text-xl font-bold text-accent-warning mb-2">❌ Error</h3>
          <p className="text-accent-warning">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8">
          {result.isFromHistory && result.historyDate && (
            <div className="mb-6 p-4 bg-yellow-500/[0.1] border border-yellow-500/[0.3] rounded-xl text-yellow-500 flex items-center gap-3 text-sm">
              <span className="text-xl">⚠️</span>
              <div>
                Data broker live tidak tersedia. Menampilkan data history terakhir dari tanggal
                <strong className="ml-1 text-yellow-400">
                  {new Date(result.historyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>
          )}

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Left Column: Compact Result */}
            <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-4">
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

            {/* Middle Column: Broker Summary & KeyStats */}
            <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-4">
              {result.brokerSummary && (
                <BrokerSummaryCard
                  emiten={result.input.emiten}
                  dateRange={`${result.input.fromDate} — ${result.input.toDate}`}
                  brokerSummary={result.brokerSummary}
                  sector={result.sector}
                />
              )}
              {keyStats && (
                <KeyStatsCard
                  emiten={result.input.emiten}
                  keyStats={keyStats}
                />
              )}
            </div>

            {/* Right Column: Price Graph & Broker Flow */}
            <div className="lg:col-span-1 xl:col-span-2 flex flex-col gap-4">
              <PriceGraph ticker={result.input.emiten} />
              <BrokerFlowCard emiten={result.input.emiten} />
            </div>

            {/* Agent Story Section - Full Width */}
            <div className="lg:col-span-3 xl:col-span-4 mt-4">
              {(agentStories.length > 0 || storyStatus !== 'idle') && (
                <AgentStoryCard
                  stories={agentStories}
                  status={storyStatus}
                  onRetry={() => handleAnalyzeStory()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}