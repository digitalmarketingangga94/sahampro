'use client';

import { useState, useEffect } from 'react';
import type { InsiderMovementItem, ActionType, SourceType } from '@/lib/types';
import { getLatestTradingDate, getDateNDaysAgo } from '@/lib/utils';
import { CalendarDays, Filter, ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface InsiderActivityCardProps {
  emiten: string;
}

const actionTypeOptions: { value: ActionType; label: string }[] = [
  { value: "ACTION_TYPE_UNSPECIFIED", label: "All Actions" },
  { value: "ACTION_TYPE_BUY", label: "Buy" },
  { value: "ACTION_TYPE_SELL", label: "Sell" },
  { value: "ACTION_TYPE_WARRANT_EXERCISE", label: "Warrant Exercise" },
  { value: "ACTION_TYPE_CONVERSION", label: "Conversion" },
  { value: "ACTION_TYPE_RIGHTS_ISSUE", label: "Rights Issue" },
  { value: "ACTION_TYPE_STOCK_SPLIT", label: "Stock Split" },
  { value: "ACTION_TYPE_REVERSE_STOCK_SPLIT", label: "Reverse Stock Split" },
  { value: "ACTION_TYPE_DIVIDEND", label: "Dividend" },
  { value: "ACTION_TYPE_BONUS_SHARE", label: "Bonus Share" },
  { value: "ACTION_TYPE_MERGER", label: "Merger" },
  { value: "ACTION_TYPE_ACQUISITION", label: "Acquisition" },
  { value: "ACTION_TYPE_DELISTING", label: "Delisting" },
  { value: "ACTION_TYPE_OTHER", label: "Other" },
];

const sourceTypeOptions: { value: SourceType; label: string }[] = [
  { value: "SOURCE_TYPE_UNSPECIFIED", label: "All Sources" },
  { value: "SOURCE_TYPE_IDX", label: "IDX" },
  { value: "SOURCE_TYPE_KSEI", label: "KSEI" },
];

const formatNumber = (numStr: string | undefined): string => {
  if (!numStr) return '-';
  const num = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(num)) return '-';
  return num.toLocaleString('id-ID');
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  // API returns "22 Jan 26", need to parse it
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const year = `20${parts[2]}`; // Assuming "26" means 2026
    return `${day} ${month} ${year}`;
  }
  return dateStr;
};

export default function InsiderActivityCard({ emiten }: InsiderActivityCardProps) {
  const [data, setData] = useState<InsiderMovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState(getLatestTradingDate());
  const [dateStart, setDateStart] = useState(getDateNDaysAgo(30, getLatestTradingDate())); // Default to 30 days ago from latest trading date
  const [actionType, setActionType] = useState<ActionType>("ACTION_TYPE_UNSPECIFIED");
  const [sourceType, setSourceType] = useState<SourceType>("SOURCE_TYPE_UNSPECIFIED");
  const [page, setPage] = useState(1);
  const [isMore, setIsMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!emiten) return;

    const fetchInsiderActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/insider-activity?emiten=${emiten}&dateStart=${dateStart}&dateEnd=${dateEnd}&actionType=${actionType}&sourceType=${sourceType}&page=${page}&limit=${limit}`
        );
        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch insider activity');
        }
        setData(json.data);
        setIsMore(json.isMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchInsiderActivity();
  }, [emiten, dateStart, dateEnd, actionType, sourceType, page]);

  return (
    <div className="glass-card-static" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 'normal' }}>
          Insider Activity ({emiten.toUpperCase()})
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="date-range-group" style={{ height: '32px', borderRadius: '8px' }}>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker()}
            />
            <span className="date-separator" style={{ margin: '0 1px', padding: 0 }}>→</span>
            <input
              type="date"
              className="input-field compact-input"
              style={{ padding: '0 0.5rem', fontSize: '0.75rem', width: '100px', textAlign: 'center', height: '100%' }}
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker()}
            />
          </div>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as ActionType)}
            className="input-field compact-input"
            style={{ width: '120px', height: '32px', padding: '0 0.5rem', fontSize: '0.75rem' }}
          >
            {actionTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            className="input-field compact-input"
            style={{ width: '100px', height: '32px', padding: '0 0.5rem', fontSize: '0.75rem' }}
          >
            {sourceTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
          No insider activity found for {emiten.toUpperCase()} in the selected period.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Holder</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Action</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Shares Traded</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Current %</th>
                  <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={`${item.id}-${index}`} style={{ borderBottom: index < data.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)' }}>
                      {formatDate(item.date)}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.data_source.type.replace('SOURCE_TYPE_', '')}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                      {item.badges && item.badges.length > 0 && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                          {item.badges.map(b => b.replace('SHAREHOLDER_BADGE_', '')).join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: item.action_type === 'ACTION_TYPE_BUY' ? 'var(--accent-success)' : (item.action_type === 'ACTION_TYPE_SELL' ? 'var(--accent-warning)' : 'var(--text-secondary)'),
                        background: item.action_type === 'ACTION_TYPE_BUY' ? 'rgba(56, 239, 125, 0.1)' : (item.action_type === 'ACTION_TYPE_SELL' ? 'rgba(245, 87, 108, 0.1)' : 'rgba(255,255,255,0.05)')
                      }}>
                        {item.action_type.replace('ACTION_TYPE_', '')}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: item.changes.value.startsWith('-') ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                        {formatNumber(item.changes.value)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {item.changes.percentage}%
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>{item.current.percentage}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Prev: {item.previous.percentage}%
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>
                      {formatNumber(item.price_formatted)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              className="btn"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem'
              }}
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Page {page}</span>
            <button
              className="btn"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: !isMore ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem'
              }}
              disabled={!isMore}
              onClick={() => setPage(prev => prev + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}