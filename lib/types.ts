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

// New Market Movers Types
export interface MarketMoverItem {
  symbol: string;
  name: string;
  last_price: number;
  change_point: number;
  change_percentage: number;
  value: number; // in IDR
  volume: number; // in shares
  frequency: number;
  net_foreign_buy?: number; // Assuming this is 'Net Foreign' from the image
}

// Raw response structure for market movers
export interface MarketMoversResponse {
  message: string;
  data: {
    mover_list: {
      stock_detail: {
        code: string;
        name: string;
        icon_url: string;
        has_uma: boolean;
        notations: any[];
        corpaction: {
          active: boolean;
          icon_url: string;
          text: string;
        };
      };
      price: number;
      change: {
        value: number;
        percentage: number;
      };
      value: {
        raw: number;
        formatted: string;
      };
      volume: {
        raw: number;
        formatted: string;
      };
      frequency: {
        raw: number;
        formatted: string;
      };
      net_foreign_buy: {
        raw: number;
        formatted: string;
      };
      net_foreign_sell: {
        raw: number;
        formatted: string;
      };
      net_buy: {
        raw: number;
        formatted: string;
      };
      net_sell: {
        raw: number;
        formatted: string;
      };
      iepiev_detail: any;
    }[];
  };
}

export type MarketMoverType = 'gainer' | 'loser' | 'value' | 'volume' | 'frequency' | 'net-foreign-buy';

// Trade Book Types
export interface TradeBookTotal {
  buy_lot: string;
  sell_lot: string;
  total_lot: string;
  buy_frequency: string;
  sell_frequency: string;
  total_frequency: string;
  buy_percentage: string;
  sell_percentage: string;
}

export interface TradeBookResponse {
  message: string;
  data: {
    book_total: TradeBookTotal;
  };
}

// Insider Activity Types
export interface InsiderValueDetail {
  value: string;
  percentage: string;
  formatted_value: string;
}

export interface InsiderChangesDetail {
  value: string;
  percentage: string;
  formatted_value: string;
}

export type ActionType = "ACTION_TYPE_UNSPECIFIED" | "ACTION_TYPE_BUY" | "ACTION_TYPE_SELL" | "ACTION_TYPE_WARRANT_EXERCISE" | "ACTION_TYPE_CONVERSION" | "ACTION_TYPE_RIGHTS_ISSUE" | "ACTION_TYPE_STOCK_SPLIT" | "ACTION_TYPE_REVERSE_STOCK_SPLIT" | "ACTION_TYPE_DIVIDEND" | "ACTION_TYPE_BONUS_SHARE" | "ACTION_TYPE_MERGER" | "ACTION_TYPE_ACQUISITION" | "ACTION_TYPE_DELISTING" | "ACTION_TYPE_OTHER";
export type SourceType = "SOURCE_TYPE_UNSPECIFIED" | "SOURCE_TYPE_IDX" | "SOURCE_TYPE_KSEI";

export interface InsiderDataSource {
  label: string;
  type: SourceType;
}

export interface InsiderBrokerDetail {
  code: string;
  group: string; // BROKER_GROUP_UNSPECIFIED etc.
}

export interface InsiderMovementItem {
  id: string;
  name: string;
  symbol: string;
  date: string; // "22 Jan 26"
  previous: InsiderValueDetail;
  current: InsiderValueDetail;
  changes: InsiderChangesDetail;
  marker: string;
  is_posted: boolean;
  cmh_id: string;
  nationality: string; // NATIONALITY_TYPE_LOCAL
  action_type: ActionType;
  data_source: InsiderDataSource;
  price_formatted: string;
  broker_detail: InsiderBrokerDetail;
  badges: string[]; // SHAREHOLDER_BADGE_DIREKTUR
}

export interface InsiderActivityResponse {
  message: string;
  data: {
    is_more: boolean;
    movement: InsiderMovementItem[];
  };
}

// New types for Broker Activity Detail API (based on user's example)
export interface BrokerOverallActivitySummary {
  bandar_detector: BrokerDetector;
  broker_summary: {
    brokers_buy: BrokerBuyItem[];
    brokers_sell: BrokerSellItem[];
    symbol: string;
  };
  from: string;
  to: string;
  broker_code: string;
  broker_name: string;
}

export interface BrokerOverallActivitySummaryResponse {
  message: string;
  data: BrokerOverallActivitySummary;
}

// New type for combined stock activity for a broker
export interface BrokerStockActivity {
  stock_code: string;
  stock_name?: string; // Not directly in the provided example, but good to have
  buy_value?: number;
  buy_lot?: number;
  buy_avg_price?: number;
  sell_value?: number;
  sell_lot?: number;
  sell_avg_price?: number;
  net_value?: number;
  net_lot?: number;
  broker_type?: 'Smartmoney' | 'Foreign' | 'Retail' | 'Mix' | 'Unknown'; // Added broker_type
}

// New type for granular broker activity per stock (for scatter plot)
export interface BrokerStockActivityPerBroker {
  broker_code: string;
  stock_code: string;
  stock_name?: string;
  broker_type: 'Smartmoney' | 'Foreign' | 'Retail' | 'Mix' | 'Unknown';
  net_value: number;
  net_lot: number;
  buy_value: number;
  sell_value: number;
  buy_lot: number;
  sell_lot: number;
  buy_avg_price: number;
  sell_avg_price: number;
}

// New types for Stockbit Search API
export interface StockbitSearchCompanyItem {
  id: string;
  name: string;
  symbol_2: string; // This is the stock code
  desc: string; // Company description
  type: string; // e.g., "Saham", "Waran"
  is_tradeable: boolean;
}

export interface StockbitSearchResponse {
  message: string;
  data: {
    company: StockbitSearchCompanyItem[];
    pagination: {
      has_more_companies: boolean;
    };
  };
}

// New types for Stock Screener API
export interface ScreenerCompany {
  country: string;
  exchange: string;
  id: string;
  name: string;
  symbol: string;
  symbol_2: string;
  symbol_3: string;
  type: string;
  badges: {
    is_new: boolean;
  };
  icon_url: string;
}

export interface ScreenerResultItem {
  display: string;
  id: number;
  item: string;
  raw: string;
}

export interface ScreenerCalc {
  company: ScreenerCompany;
  results: ScreenerResultItem[];
}

export interface ScreenerRule {
  item1: number;
  item1_name: string;
  item2: string;
  item2_name: string;
  multiplier: string;
  operator: string;
  type: string;
}

export interface ScreenerColumn {
  coloring: string;
  id: number;
  name: string;
  removable: string;
}

export interface StockScreenerResponse {
  data: {
    calcs: ScreenerCalc[];
    rules: ScreenerRule[];
    columns: ScreenerColumn[];
    curpage: number;
    favorite: boolean;
    isguru: boolean;
    order: number;
    perpage: number;
    screen_desc: string;
    screen_name: string;
    screenerid: number;
    sequence: string[];
    sort: string;
    totalrows: number;
    universe: string;
    type: string;
  };
  message: string;
}