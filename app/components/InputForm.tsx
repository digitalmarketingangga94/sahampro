'use client';

import { useState, useEffect } from 'react';
import type { StockInput } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import the new Button component

interface InputFormProps {
  onSubmit: (data: StockInput) => void;
  loading: boolean;
  initialEmiten?: string | null;
  fromDate: string;
  toDate: string;
  onDateChange: (fromDate: string, toDate: string) => void;
  // Action Button Props
  onCopyText?: () => void;
  onCopyImage?: () => void;
  onAnalyzeAI?: () => void;
  copiedText?: boolean;
  copiedImage?: boolean;
  storyStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  hasResult?: boolean;
}

export default function InputForm({
  onSubmit,
  loading,
  initialEmiten,
  fromDate,
  toDate,
  onDateChange,
  onCopyText,
  onCopyImage,
  onAnalyzeAI,
  copiedText,
  copiedImage,
  storyStatus,
  hasResult
}: InputFormProps) {
  const [emiten, setEmiten] = useState('SOCI');
  const [currentFlag, setCurrentFlag] = useState<'OK' | 'NG' | 'Neutral' | null>(null);

  useEffect(() => {
    if (initialEmiten) {
      setEmiten(initialEmiten.toUpperCase());
    }
  }, [initialEmiten]);

  // Fetch current flag when emiten changes
  useEffect(() => {
    const fetchFlag = async () => {
      if (!emiten) {
        setCurrentFlag(null);
        return;
      }
      try {
        const res = await fetch(`/api/emiten/flag?emiten=${emiten}`);
        const json = await res.json();
        if (json.success) {
          setCurrentFlag(json.flag);
        }
      } catch (err) {
        console.error('Error fetching flag:', err);
      }
    };
    fetchFlag();
  }, [emiten]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ emiten, fromDate, toDate });
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();

    if (days === 0) {
      // For 1D, ensure both dates are today
      start.setDate(end.getDate());
    } else {
      start.setDate(end.getDate() - days);
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    onDateChange(formatDate(start), formatDate(end));
  };

  const handleFlag = async (flag: 'OK' | 'NG' | 'Neutral') => {
    if (!emiten) return;
    try {
      const res = await fetch('/api/emiten/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emiten, flag }),
      });
      if (res.ok) {
        setCurrentFlag(flag);
        window.dispatchEvent(new CustomEvent('emiten-flagged', {
          detail: { emiten, flag }
        }));
      }
    } catch (err) {
      console.error('Error flagging emiten:', err);
    }
  };

  return (
    <div className="bg-card-hover backdrop-blur-xl border border-border-color rounded-xl p-4 md:p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 className="uppercase tracking-wide text-sm md:text-base font-semibold text-text-primary">Analyze Stock</h3>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDateRange(0)} className="px-2 py-1 text-xs text-text-secondary border border-border-color rounded-md hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/[0.1] transition-all">1D</button>
            <button type="button" onClick={() => setDateRange(7)} className="px-2 py-1 text-xs text-text-secondary border border-border-color rounded-md hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/[0.1] transition-all">1W</button>
            <button type="button" onClick={() => setDateRange(30)} className="px-2 py-1 text-xs text-text-secondary border border-border-color rounded-md hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/[0.1] transition-all">1M</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-4 md:gap-6 mb-4">
          <div className="flex-1 w-full md:w-auto">
            <label htmlFor="emiten" className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">
              Emiten
            </label>
            <div className="flex items-center gap-1 bg-secondary border border-border-color rounded-lg px-3 py-2 focus-within:border-accent-primary transition-all">
              <input
                id="emiten"
                type="text"
                value={emiten}
                onChange={(e) => setEmiten(e.target.value.toUpperCase())}
                placeholder="CODE"
                required
                className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm font-bold tracking-wide w-full"
              />
              <div className="flex items-center opacity-100 transition-opacity">
                {currentFlag === 'OK' && <CheckCircle2 size={16} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />}
                {currentFlag === 'NG' && <XCircle size={16} color="#f97316" fill="rgba(249, 115, 22, 0.2)" />}
                {currentFlag === 'Neutral' && <MinusCircle size={16} color="var(--text-secondary)" />}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">
              Date Range
            </label>
            <div className="flex items-center bg-secondary border border-border-color rounded-lg overflow-hidden h-10 focus-within:border-accent-primary transition-all">
              <input
                id="fromDate"
                type="date"
                className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm text-center px-2 py-1 w-full appearance-none"
                value={fromDate}
                onChange={(e) => onDateChange(e.target.value, toDate)}
                onClick={(e) => e.currentTarget.showPicker()}
                required
              />
              <span className="text-text-secondary text-sm px-1">→</span>
              <input
                id="toDate"
                type="date"
                className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm text-center px-2 py-1 w-full appearance-none"
                value={toDate}
                onChange={(e) => onDateChange(fromDate, e.target.value)}
                onClick={(e) => e.currentTarget.showPicker()}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              {loading ? '...' : 'Analyze'}
            </Button>

            <Button
              type="button"
              onClick={onAnalyzeAI}
              disabled={storyStatus === 'pending' || storyStatus === 'processing' || !hasResult}
              className="w-full md:w-auto px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-purple-600 to-emerald-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {storyStatus === 'pending' || storyStatus === 'processing' ? (
                <span className="flex items-center gap-1">
                  ⏳ Analyzing...
                </span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                  </svg>
                  Analyze Story
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Flagging Buttons */}
        <div className="flex justify-center md:justify-end gap-2 border-t border-border-color pt-4 mt-4">
          <Button
            type="button"
            onClick={() => handleFlag('OK')}
            className={`p-2 rounded-lg text-blue-400 border ${currentFlag === 'OK' ? 'bg-blue-600/[0.25] border-blue-600 shadow-blue-600/30' : 'bg-blue-600/[0.05] border-blue-600/[0.2]'} shadow-md hover:shadow-lg transition-all`}
            title="Mark as OK"
          >
            <CheckCircle2 size={16} fill={currentFlag === 'OK' ? 'rgba(59, 130, 246, 0.4)' : 'none'} />
          </Button>
          <Button
            type="button"
            onClick={() => handleFlag('NG')}
            className={`p-2 rounded-lg text-orange-400 border ${currentFlag === 'NG' ? 'bg-orange-600/[0.25] border-orange-600 shadow-orange-600/30' : 'bg-orange-600/[0.05] border-orange-600/[0.2]'} shadow-md hover:shadow-lg transition-all`}
            title="Mark as NG"
          >
            <XCircle size={16} fill={currentFlag === 'NG' ? 'rgba(249, 115, 22, 0.4)' : 'none'} />
          </Button>
          <Button
            type="button"
            onClick={() => handleFlag('Neutral')}
            className={`p-2 rounded-lg text-text-secondary border ${currentFlag === 'Neutral' ? 'bg-white/[0.15] border-white/[0.4]' : 'bg-white/[0.05] border-white/[0.1]'} shadow-md hover:shadow-lg transition-all`}
            title="Mark as Neutral"
          >
            <MinusCircle size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}