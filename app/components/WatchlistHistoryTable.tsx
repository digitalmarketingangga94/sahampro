'use client';

import { useState, useEffect } from 'react';
import { exportHistoryToPDF } from '@/lib/pdfExport';

interface AnalysisRecord {
  id: number;
  from_date: string;
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;       // maps to offer_teratas
  arb?: number;       // maps to bid_terbawah
  target_realistis?: number;
  target_max?: number;
  real_harga?: number;
  status: string;
  error_message?: string;
}

export default function WatchlistHistoryTable() {
  const [data, setData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    emiten: '',
    sector: 'all',
    fromDate: '',
    toDate: '',
    status: 'all'
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ column: 'from_date', direction: 'desc' });
  const [sectors, setSectors] = useState<string[]>([]);
  const pageSize = 50;

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [filters, page, sort]);

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/sectors');
      const json = await response.json();
      if (json.success) {
        setSectors(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  // Debounced fetch for text inputs could be added, but manual trigger or loose effect is fine for now

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });

      if (filters.emiten) params.append('emiten', filters.emiten);
      if (filters.sector !== 'all') params.append('sector', filters.sector);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);

      const response = await fetch(`/api/watchlist-history?${params}`);
      const json = await response.json();

      if (json.success) {
        setData(json.data || []);
        setTotalCount(json.count || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number) => num?.toLocaleString() ?? '-';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Handle YYYY-MM-DD format
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).replace(' ', '-');
  };

  const calculateGain = (price: number | undefined, target: number | undefined) => {
    if (!price || !target || price === 0) return null;
    const gain = ((target - price) / price) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;
  };

  return (
    <div className="bg-card border border-border-color rounded-xl p-6 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-text-primary">📊 Watchlist Analysis History</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-secondary hover:bg-white/[0.1] text-text-secondary text-sm font-medium rounded-lg transition-colors"
            onClick={fetchHistory}
          >
            Refresh
          </button>
          <button
            className="px-4 py-2 bg-gradient-success hover:bg-accent-success/90 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-accent-success/[0.4]"
            onClick={() => exportHistoryToPDF(data, filters)}
            disabled={data.length === 0}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">Emiten</label>
          <input
            type="text"
            className="w-full bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-all"
            placeholder="e.g., BBCA"
            value={filters.emiten}
            onChange={(e) => {
              setFilters({ ...filters, emiten: e.target.value.toUpperCase() });
              setPage(0); // Reset page on filter change
            }}
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">From Date</label>
          <input
            type="date"
            className="w-full bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-all appearance-none"
            value={filters.fromDate}
            onChange={(e) => {
              setFilters({ ...filters, fromDate: e.target.value });
              setPage(0);
            }}
            onClick={(e) => e.currentTarget.showPicker()}
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">To Date</label>
          <input
            type="date"
            className="w-full bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-all appearance-none"
            value={filters.toDate}
            onChange={(e) => {
              setFilters({ ...filters, toDate: e.target.value });
              setPage(0);
            }}
            onClick={(e) => e.currentTarget.showPicker()}
          />
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">Status</label>
          <select
            className="w-full bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-all"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(0);
            }}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs uppercase tracking-wide font-medium text-text-secondary mb-1">Sector</label>
          <select
            className="w-full bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-primary transition-all"
            value={filters.sector}
            onChange={(e) => {
              setFilters({ ...filters, sector: e.target.value });
              setPage(0);
            }}
          >
            <option value="all">All Sectors</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner w-8 h-8 mx-auto"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-text-secondary bg-secondary rounded-xl">
          No data found matching your filters
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-border-color rounded-xl">
            <table className="w-full text-sm border-collapse min-w-[800px]">
              <thead className="bg-secondary">
                <tr>
                  <th
                    className="p-4 text-left text-text-secondary font-semibold whitespace-nowrap cursor-pointer"
                    onClick={() => {
                      const direction = sort.column === 'from_date' && sort.direction === 'desc' ? 'asc' : 'desc';
                      setSort({ column: 'from_date', direction });
                    }}
                  >
                    Date {sort.column === 'from_date' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    className="p-4 text-left text-text-secondary font-semibold whitespace-nowrap cursor-pointer"
                    onClick={() => {
                      const direction = sort.column === 'emiten' && sort.direction === 'asc' ? 'desc' : 'asc';
                      setSort({ column: 'emiten', direction });
                    }}
                  >
                    Emiten {sort.column === 'emiten' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Harga</th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Target R1</th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Target Max</th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Real Harga</th>
                  <th className="p-4 text-left text-text-secondary font-semibold">Bandar</th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Vol Bandar</th>
                  <th className="p-4 text-right text-text-secondary font-semibold">Avg Bandar</th>
                  <th className="p-4 text-center text-text-secondary font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`border-b border-border-color/[0.5] last:border-b-0 ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                  >
                    <td className="p-3 text-sm">{formatDate(record.from_date)}</td>
                    <td className="p-3 text-sm">
                      <div className="font-semibold text-accent-primary">{record.emiten}</div>
                      {record.sector && (
                        <div className="text-xs text-text-muted mt-0.5">
                          {record.sector}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums text-base">
                      {formatNumber(record.harga)}
                    </td>
                    <td className="p-2 text-right align-middle">
                      <div className="font-semibold tabular-nums text-base text-accent-success">
                        {formatNumber(record.target_realistis)}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {calculateGain(record.harga, record.target_realistis)}
                      </div>
                    </td>
                    <td className="p-2 text-right align-middle">
                      <div className="font-semibold tabular-nums text-base text-accent-warning">
                        {formatNumber(record.target_max)}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {calculateGain(record.harga, record.target_max)}
                      </div>
                    </td>
                    <td className="p-2 text-right align-middle">
                      {record.real_harga ? (
                        <>
                          <div className={`font-semibold tabular-nums text-base ${
                            record.target_realistis && record.real_harga >= record.target_realistis
                              ? 'text-accent-success'
                              : (record.harga && record.real_harga > record.harga
                                ? 'text-yellow-500' // Yellow/Orange for profit but below target
                                : 'text-accent-warning') // Red for loss
                          }`}>
                            {formatNumber(record.real_harga)}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            {calculateGain(record.harga, record.real_harga)}
                          </div>
                        </>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{record.bandar || '-'}</td>
                    <td className="p-3 text-right tabular-nums text-sm">
                      {formatNumber(record.barang_bandar)}
                    </td>
                    <td className="p-2 text-right align-middle">
                      <div className="font-semibold tabular-nums text-base">
                        {formatNumber(record.rata_rata_bandar)}
                      </div>
                      {record.rata_rata_bandar && record.harga && record.rata_rata_bandar < record.harga && (
                        <div className="text-xs text-text-secondary mt-0.5">
                          {calculateGain(record.rata_rata_bandar, record.harga)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {record.status === 'success' ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-success/[0.1] text-accent-success">
                          ✓
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-warning/[0.1] text-accent-warning cursor-pointer"
                          title={record.error_message}
                        >
                          ✕
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <div className="text-text-secondary text-sm">
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} records
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-secondary border border-border-color text-text-primary text-sm font-medium rounded-lg transition-colors disabled:text-text-muted disabled:opacity-50"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 bg-secondary border border-border-color text-text-primary text-sm font-medium rounded-lg transition-colors disabled:text-text-muted disabled:opacity-50"
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}