export interface StockInput {
  emiten: string;
  fromDate: string;
  toDate: string;
}

export interface MarketDetectorBroker {
  netbs_broker_code: string;
  bval: string;
  blot: string;
  netbs_buy_avg_price: string;
}

// Broker Summary Types
export interface BrokerTopStat {
  vol: number;
  percent: number;
  amount: number;
  accdist: string;
}

export interface BrokerDetector {
  average: number;
  avg: BrokerTopStat;
  avg5?: BrokerTopStat; // Added based on example
  broker_accdist: string;
  number_broker_buysell: number;
  top1: BrokerTopStat;
  top3: BrokerTopStat;
  top5: BrokerTopStat;
  top10?: BrokerTopStat; // Added based on example
  total_buyer: number;
  total_seller: number;
  value: number;
  volume: number;
}

export interface BrokerBuyItem {
  blot: string;
  blotv: string;
  bval: string;
  bvalv: string;
  netbs_broker_code: string;
  netbs_buy_avg_price: string;
  netbs_date: string; // Added this property
  netbs_stock_code: string; // Added this property
  type: string; // Added this property
}

export interface BrokerSellItem {
  netbs_broker_code: string;
  netbs_date: string;
  netbs_sell_avg_price: string;
  netbs_stock_code: string; // Added this property
  slot: string;
  slotv: string;
  sval: string;
  svalv: string;
  type: string;
}

export interface BrokerSummaryData {
  detector: BrokerDetector;
  topBuyers: BrokerBuyItem[];
  topSellers: BrokerSellItem[];
}

export interface MarketDetectorResponse {
  data: {
    broker_summary: {
      brokers_buy: BrokerBuyItem[];
      brokers_sell: BrokerSellItem[];
    };
    bandar_detector: BrokerDetector;
  };
}

export interface OrderbookData {
  close: number;
  high: number;
  ara: { value: string };
  arb: { value: string };
  offer: { price: string; que_num: string; volume: string; change_percentage: string }[];
  bid: { price: string; que_num: string; volume: string; change_percentage: string }[];
  total_bid_offer: {
    bid: { lot: string };
    offer: { lot: string };
  };
}

export interface OrderbookResponse {
  data: OrderbookData;
}


export interface BrokerData {
  bandar: string;
  barangBandar: number;
  rataRataBandar: number;
}

export interface MarketData {
  harga: number;
  offerTeratas: number;
  bidTerbawah: number;
  fraksi: number;
  totalBid: number;
  totalOffer: number;
}

export interface CalculatedData {
  totalPapan: number;
  rataRataBidOfer: number;
  a: number;
  p: number;
  targetRealistis1: number;
  targetMax: number;
}

export interface StockAnalysisResult {
  input: StockInput;
  stockbitData: BrokerData;
  marketData: MarketData;
  calculated: CalculatedData;
  brokerSummary?: BrokerSummaryData;
  isFromHistory?: boolean;
  historyDate?: string;
  sector?: string;
}

// Make ApiResponse generic
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WatchlistItem {
  company_id: number;
  company_code: string; // Keeping for compatibility, might be mapped from symbol
  symbol: string;       // New field from API
  company_name: string;
  last_price: number;
  change_point: number;
  change_percentage: number;
  percent: string;      // Percentage from API (e.g., "-1.23")
  volume: number;
  frequency: number;
  sector?: string;      // Sector information from emiten info API
  formatted_price?: string;
  formatted_change_percentage?: string;
  flag?: 'OK' | 'NG' | 'Neutral' | null;
}

export interface WatchlistMetaResponse {
  message: string;
  data: {
    watchlist_id: number;
  };
}

export interface WatchlistDetailResponse {
  message: string;
  data: {
    watchlist_id: number;
    result: WatchlistItem[];
  };
}

export type WatchlistResponse = WatchlistDetailResponse; // Alias for backward compatibility if needed, or just use WatchlistDetailResponse

export interface WatchlistGroup {
  watchlist_id: number;
  name: string;
  description: string;
  is_default: boolean;
  is_favorite: boolean;
  emoji: string;
  category_type: string;
  total_items: number;
}

export interface WatchlistGroupsResponse {
  message: string;
  data: WatchlistGroup[];
}

export interface EmitenInfoResponse {
  data: {
    sector: string;
    sub_sector: string;
    symbol: string;
    name: string;
    price: string;
    change: string;
    percentage: number;
  };
  message: string;
}

// KeyStats types
export interface KeyStatsItem {
  id: string;
  name: string;
  value: string;
}

export interface KeyStatsCategory {
  keystats_name: string;
  fin_name_results: {
    fitem: KeyStatsItem;
    hidden_graph_ico: boolean;
    is_new_update: boolean;
  }[];
}

export interface KeyStatsResponse {
  data: {
    closure_fin_items_results: KeyStatsCategory[];
  };
  message: string;
}

// Processed KeyStats data for UI
export interface KeyStatsData {
  perShare: KeyStatsItem[]; // New category
  currentValuation: KeyStatsItem[];
  incomeStatement: KeyStatsItem[];
  balanceSheet: KeyStatsItem[];
  profitability: KeyStatsItem[];
  growth: KeyStatsItem[];
}

// Agent Story Types
export interface MatriksStoryItem {
  kategori_story: string;
  deskripsi_katalis: string;
  logika_ekonomi_pasar: string;
  potensi_dampak_harga: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ChecklistKatalis {
  item: string;
  dampak_instan: string;
}

export interface StrategiTrading {
  tipe_saham: string;
  target_entry: string;
  exit_strategy: {
    take_profit: string;
    stop_loss: string;
  };
}

export interface AgentStoryResult {
  id?: number;
  emiten: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  matriks_story?: MatriksStoryItem[];
  swot_analysis?: SwotAnalysis;
  checklist_katalis?: ChecklistKatalis[];
  keystat_signal?: string;
  strategi_trading?: StrategiTrading;
  kesimpulan?: string;
  error_message?: string;
  created_at?: string;
}

// Broker Flow Types (from tradersaham broker-intelligence API)
export interface BrokerFlowDailyData {
  d: string;        // Date (YYYY-MM-DD)
  n: number;        // Net value
  p: number;        // Price
  a: number;        // Average (0 if selling)
}

export interface BrokerFlowActivity {
  broker_code: string;
  stock_code: string;
  broker_status: 'Bandar' | 'Foreign' | 'Retail' | 'Mix' | 'Whale'; // Added 'Whale'
  stock_name: string;
  net_value: string;
  total_buy_value: string;
  total_buy_volume: string;
  buy_days: string;
  active_days: string;
  consistency_pct: string;
  daily_data: BrokerFlowDailyData[];
  current_price: string;
  float_pl_pct: string;
  buy_avg_price?: number; // New field for calculated average buy price
  dominant_percentage?: number; // Added this property
}

export interface BrokerFlowResponse {
  trading_dates: string[];
  total_trading_days: number;
  sort_by: string;
  activities: BrokerFlowActivity[];
}

// Background Job Log Types
export interface BackgroundJobLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  emiten?: string;
  details?: Record<string, unknown>;
}

export interface BackgroundJobLog {
  id: number;
  job_name: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  success_count: number;
  error_count: number;
  total_items: number;
  log_entries: BackgroundJobLogEntry[];
  error_message?: string;
  metadata?: Record<string, unknown>;
}

// Stockbit Search Types
export interface StockbitSearchCompanyItem {
  symbol_2: string;
  name: string;
  icon_url: string;
  // Add other properties if needed from the search API response
}

export interface StockbitSearchResponse {
  data: {
    company: StockbitSearchCompanyItem[];
    // Other search categories like 'news', 'people', etc.
  };
  message: string;
}

// Market Movers Types
export type MarketMoverType = 'gainer' | 'loser' | 'value' | 'volume' | 'frequency' | 'net-foreign-buy';

export interface MarketMoverItem {
  symbol: string;
  name: string;
  last_price: number;
  change_point: number;
  change_percentage: number;
  value: number;
  volume: number;
  frequency: number;
  net_foreign_buy?: number; // Specific to 'net-foreign-buy' type
}

export interface MarketMoversResponse {
  data: {
    mover_list: {
      stock_detail: {
        code: string;
        name: string;
      };
      price: number;
      change: {
        value: number;
        percentage: number;
      };
      value: { raw: number };
      volume: { raw: number };
      frequency: { raw: number };
      net_foreign_buy?: { raw: number };
    }[];
  };
  message: string;
}

// Trade Book Types
export interface TradeBookItem {
  price: number;
  volume: number;
  time: string;
  type: 'buy' | 'sell';
}

export interface TradeBookTotal {
  total_buy_value: number;
  total_sell_value: number;
  total_buy_volume: number;
  total_sell_volume: number;
  trades: TradeBookItem[];
}

export interface TradeBookResponse {
  data: {
    book_total: TradeBookTotal;
  };
  message: string;
}

// Insider Activity Types
export type ActionType =
  | "ACTION_TYPE_UNSPECIFIED"
  | "ACTION_TYPE_BUY"
  | "ACTION_TYPE_SELL"
  | "ACTION_TYPE_WARRANT_EXERCISE"
  | "ACTION_TYPE_CONVERSION"
  | "ACTION_TYPE_RIGHTS_ISSUE"
  | "ACTION_TYPE_STOCK_SPLIT"
  | "ACTION_TYPE_REVERSE_STOCK_SPLIT"
  | "ACTION_TYPE_DIVIDEND"
  | "ACTION_TYPE_BONUS_SHARE"
  | "ACTION_TYPE_MERGER"
  | "ACTION_TYPE_ACQUISITION"
  | "ACTION_TYPE_DELISTING"
  | "ACTION_TYPE_OTHER";

export type SourceType =
  | "SOURCE_TYPE_UNSPECIFIED"
  | "SOURCE_TYPE_IDX"
  | "SOURCE_TYPE_KSEI";

export interface InsiderMovementItem {
  id: string;
  date: string;
  symbol: string;
  name: string;
  action_type: ActionType;
  changes: {
    value: string;
    percentage: string;
  };
  current: {
    value: string;
    percentage: string;
  };
  previous: {
    value: string;
    percentage: string;
  };
  price_formatted: string;
  broker_detail?: {
    code: string;
    name: string;
  };
  nationality?: string;
  data_source: {
    type: SourceType;
  };
}

export interface InsiderActivityResponse {
  data: {
    movement: InsiderMovementItem[];
    is_more: boolean;
  };
  message: string;
}

// Broker Activity Detail Types
import { BrokerType } from './brokers'; // Import BrokerType from brokers.ts
export interface BrokerStockActivityPerBroker {
  broker_code: string;
  stock_code: string;
  broker_type: BrokerType; // Changed to BrokerType
  net_value: number;
  net_lot: number;
  buy_value: number;
  buy_lot: number;
  buy_avg_price: number;
  sell_value: number;
  sell_lot: number;
  sell_avg_price: number;
  stock_name?: string;
}

export interface BrokerOverallActivitySummary {
  brokers_buy: BrokerBuyItem[];
  brokers_sell: BrokerSellItem[];
  // Add other properties if available in the API response
}

export interface BrokerOverallActivitySummaryResponse {
  data: {
    broker_summary: BrokerOverallActivitySummary;
  };
  message: string;
}

// Broker Screener Types
export interface BrokerScreenerResultItem {
  symbol: string;
  stock_name?: string;
  net_direction: 'All Net Buy' | 'All Net Sell';
  net_lot: number;
  avg_per_day: number;
  avg_price?: number; // Added avg_price
  dominant_broker: string;
  dominant_percent: number;
}

// Top Stock Types
export interface TopStockValue {
  raw: string;
  formatted: string;
}

export interface TopStockItem {
  rank: number;
  code: string;
  name: string;
  value: TopStockValue;
  lot: TopStockValue;
  average: TopStockValue;
  foreign_value: TopStockValue;
  frequency: TopStockValue;
}

export interface TopStockResponse {
  data: {
    top_buy: TopStockItem[];
    top_sell: TopStockItem[];
  };
  message: string;
}

// IHSG Daily Chart Types
export interface IHSGPricePoint {
  date: string;
  formatted_date: string;
  xlabel: string;
  value: string;
  percentage: string;
  change: number;
  open: string;
  high: string;
  low: string;
  volume: string;
}

export interface IHSGDailyChartData {
  cagr: string;
  change: number;
  drawdown: string;
  markingpoint: string;
  percentage: string;
  prices: IHSGPricePoint[];
  timeframe: string;
  xaxisopt: string;
  previous: number;
  line_weight: number;
  previous_timeframe_price: IHSGPricePoint;
  chart_type: string;
  interval_in_minutes: number;
  allowed_chart_type: string[];
  max_candles: number;
}

export interface IHSGDailyChartResponse {
  data: IHSGDailyChartData;
  message: string;
}

// NEW: IHSG Foreign Domestic Chart Types
export interface ForeignDomesticValue {
  raw: number;
  formatted: string;
}

export interface ForeignDomesticValueWithPercentage extends ForeignDomesticValue {
  percentage: {
    raw: number;
    formatted: string;
  };
}

export interface ForeignDomesticSummary {
  date_range: string;
  foreign_buy: ForeignDomesticValue;
  foreign_sell: ForeignDomesticValue;
  net_foreign: ForeignDomesticValue;
  domestic_buy: ForeignDomesticValue;
  domestic_sell: ForeignDomesticValue;
  net_domestic: ForeignDomesticValue;
  all_markets_summary: ForeignDomesticValue[];
  volume: {
    domestic_buy: ForeignDomesticValue;
    domestic_sell: ForeignDomesticValue;
    net_domestic: ForeignDomesticValue;
    foreign_sell: ForeignDomesticValue;
    foreign_buy: ForeignDomesticValue;
    net_foreign_reguler: ForeignDomesticValue;
    net_foreign_tunai_nego: ForeignDomesticValue;
    net_foreign_all_market: ForeignDomesticValue;
  };
}

export interface ForeignDomesticBreakdown {
  label: string;
  total: ForeignDomesticValue;
  foreign_buy: ForeignDomesticValueWithPercentage;
  foreign_sell: ForeignDomesticValueWithPercentage;
  domestic_buy: ForeignDomesticValueWithPercentage;
  domestic_sell: ForeignDomesticValueWithPercentage;
  foreign_total: ForeignDomesticValueWithPercentage;
  domestic_total: ForeignDomesticValueWithPercentage;
}

export interface IHSGForeignDomesticChartData {
  summary: ForeignDomesticSummary;
  value: ForeignDomesticBreakdown;
  volume: ForeignDomesticBreakdown;
  frequency: ForeignDomesticBreakdown;
  last_updated: string;
  from: string;
  to: string;
}

export interface IHSGForeignDomesticChartResponse {
  message: string;
  data: IHSGForeignDomesticChartData;
}