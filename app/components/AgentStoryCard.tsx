'use client';

import { useState, useEffect, useRef } from 'react';
import type { AgentStoryResult, MatriksStoryItem, ChecklistKatalis } from '@/lib/types';

interface AgentStoryCardProps {
  stories: AgentStoryResult[];
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  onRetry?: () => void;
}

export default function AgentStoryCard({ stories, status, onRetry }: AgentStoryCardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevStatusRef = useRef(status);

  // Update selectedId when new stories arrive or when analysis completes
  useEffect(() => {
    if (stories.length > 0) {
      // 1. Initial selection if nothing selected
      if (!selectedId) {
        setSelectedId(stories[0].id || null);
      }
      
      // 2. Auto-switch to newest if analysis just finished
      if (prevStatusRef.current !== 'completed' && status === 'completed') {
        setSelectedId(stories[0].id || null);
      }
    }
    prevStatusRef.current = status;
  }, [stories, status, selectedId]);

  const data = stories.find(s => s.id === selectedId) || stories[0];
  // Loading state
  if (status === 'pending' || status === 'processing') {
    return (
      <div className="bg-card border border-border-color rounded-xl p-8 text-center shadow-md">
        <div className="spinner w-8 h-8 mx-auto mb-4"></div>
        <p className="text-text-secondary mb-2">
          {status === 'pending' ? 'Memulai analisis...' : 'AI sedang menganalisis berita...'}
        </p>
        <p className="text-text-muted text-xs">
          Proses ini membutuhkan waktu beberapa menit
        </p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="bg-accent-warning/[0.1] border border-accent-warning rounded-xl p-8 text-center shadow-md">
        <p className="text-accent-warning mb-4">
          ❌ {stories[0]?.error_message || 'Gagal menganalisis story'}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            🔄 Coba Lagi
          </button>
        )}
      </div>
    );
  }

  // No data state
  if ((!stories || stories.length === 0) && status === 'idle') {
    return null;
  }

  return (
    <div className="bg-card border border-border-color rounded-xl p-5 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border-color">
        <span className="text-xl">🤖</span>
        <h3 className="m-0 text-lg font-medium text-text-primary opacity-90">
          AI Story Analysis
        </h3>

        {/* Multi-version Dropdown */}
        {stories.length > 1 && (
          <select 
            value={selectedId || ''} 
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="ml-auto px-2 py-1 text-xs bg-white/[0.05] border border-white/[0.1] rounded-md text-text-secondary cursor-pointer outline-none focus:border-accent-primary transition-all"
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id} className="bg-secondary">
                {s.created_at ? new Date(s.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Unknown Date'}
              </option>
            ))}
          </select>
        )}

        {stories.length <= 1 && data?.created_at && (
          <span className="text-xs text-text-muted ml-auto">
            {new Date(data.created_at).toLocaleDateString('id-ID')}
          </span>
        )}
      </div>

      {/* Section 1: Matriks Story */}
      {data.matriks_story && data.matriks_story.length > 0 && (
        <div className="mb-6">
          <h4 className="text-base text-text-primary mb-3 font-medium opacity-90">
            1. Matriks Story & Logika Pergerakan Harga
          </h4>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-color">
                  <th className="p-2 text-left text-text-secondary font-normal">Kategori</th>
                  <th className="p-2 text-left text-text-secondary font-normal">Katalis</th>
                  <th className="p-2 text-left text-text-secondary font-normal">Logika Pasar</th>
                  <th className="p-2 text-left text-text-secondary font-normal">Dampak Harga</th>
                </tr>
              </thead>
              <tbody>
                {data.matriks_story.map((item: MatriksStoryItem, idx: number) => (
                  <tr key={idx} className="border-b border-border-color/[0.05]">
                    <td className="p-2 text-text-secondary font-medium">
                      {item.kategori_story}
                    </td>
                    <td className="p-2 text-text-primary">
                      {item.deskripsi_katalis}
                    </td>
                    <td className="p-2 text-text-secondary">
                      {item.logika_ekonomi_pasar}
                    </td>
                    <td className="p-2 text-accent-primary">
                      {item.potensi_dampak_harga}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: SWOT Analysis */}
      {data.swot_analysis && (
        <div className="mb-6">
          <h4 className="text-base text-text-primary mb-3 font-medium opacity-90">
            2. Analisis SWOT
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <span className="text-accent-success font-medium">Strengths</span>
              <ul className="mt-2 ml-4 list-disc text-text-secondary">
                {data.swot_analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <span className="text-accent-warning font-medium">Weaknesses</span>
              <ul className="mt-2 ml-4 list-disc text-text-secondary">
                {data.swot_analysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <span className="text-accent-primary font-medium">Opportunities</span>
              <ul className="mt-2 ml-4 list-disc text-text-secondary">
                {data.swot_analysis.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
            <div className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.05]">
              <span className="text-yellow-500 font-medium">Threats</span>
              <ul className="mt-2 ml-4 list-disc text-text-secondary">
                {data.swot_analysis.threats?.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Checklist Katalis */}
      {data.checklist_katalis && data.checklist_katalis.length > 0 && (
        <div className="mb-6">
          <h4 className="text-base text-text-primary mb-3 font-medium opacity-90">
            3. Checklist Katalis Jangka Pendek
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {data.checklist_katalis.map((item: ChecklistKatalis, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                <div className="bg-white/[0.1] min-w-6 h-6 rounded-full flex items-center justify-center text-xs text-text-secondary flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-text-primary font-medium mb-1">
                    {item.item}
                  </div>
                  <div className="text-text-muted text-xs leading-tight">
                    <span className="text-accent-primary mr-1">→</span>
                    {item.dampak_instan}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Strategi Trading */}
      {data.strategi_trading && (
        <div className="mb-6">
          <h4 className="text-base text-text-primary mb-3 font-medium opacity-90">
            4. Strategi Trading
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {/* Tipe Saham */}
            <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05] flex flex-col gap-1">
              <span className="text-text-muted text-xs uppercase tracking-wider">Tipe Saham</span>
              <span className="text-text-primary font-medium">{data.strategi_trading.tipe_saham}</span>
            </div>

            {/* Target Entry */}
            <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05] flex flex-col gap-1">
              <span className="text-text-muted text-xs uppercase tracking-wider">Target Entry</span>
              <span className="text-text-primary font-medium">{data.strategi_trading.target_entry}</span>
            </div>

            {/* Take Profit */}
            <div className="p-3 bg-accent-success/[0.05] rounded-lg border border-accent-success/[0.15] border-l-4 border-l-accent-success flex flex-col gap-1">
              <span className="text-accent-success text-xs font-semibold uppercase tracking-wider">Take Profit</span>
              <span className="text-text-primary font-medium">
                {data.strategi_trading.exit_strategy?.take_profit}
              </span>
            </div>

            {/* Stop Loss */}
            <div className="p-3 bg-accent-warning/[0.05] rounded-lg border border-accent-warning/[0.15] border-l-4 border-l-accent-warning flex flex-col gap-1">
              <span className="text-accent-warning text-xs font-semibold uppercase tracking-wider">Stop Loss</span>
              <span className="text-text-primary font-medium">
                {data.strategi_trading.exit_strategy?.stop_loss}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: KeyStat Signal */}
      {data.keystat_signal && (
        <div className="mb-6">
          <h4 className="text-base text-text-primary mb-3 font-medium opacity-90">
            5. Fundamental Signal (Key Statistics)
          </h4>
          <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.05] text-sm leading-relaxed text-text-secondary">
            {data.keystat_signal}
          </div>
        </div>
      )}

      {/* Kesimpulan */}
      {data.kesimpulan && (
        <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.05] text-sm leading-relaxed">
          <span className="text-text-primary font-medium">Kesimpulan:</span>
          <p className="mt-2 text-text-secondary">{data.kesimpulan}</p>
        </div>
      )}
    </div>
  );
}