import type { MarketDetectorResponse, OrderbookResponse, BrokerData, WatchlistResponse, BrokerSummaryData, EmitenInfoResponse, KeyStatsResponse, KeyStatsData, KeyStatsItem, WatchlistGroup, MarketMoversResponse, MarketMoverType, MarketMoverItem, TradeBookTotal, TradeBookResponse, InsiderActivityResponse, ActionType, SourceType, BrokerOverallActivitySummaryResponse, StockbitSearchResponse, StockbitSearchCompanyItem, TopStockResponse, IdxSector, IdxSectorCompaniesResponse } from './types';
import { getSessionValue, upsertSession } from './supabase';

const STOCKBIT_BASE_URL = 'https://exodus.stockbit.com';
const STOCKBIT_FINDATA_VIEW_URL = 'https://exodus.stockbit.com/findata-view'; // New base URL for findata-view
const STOCKBIT_ORDERBOOK_API_URL = 'https://exodus.stockbit.com/company-price-feed/v2/orderbook/companies'; // New base URL for orderbook API
const STOCKBIT_EMITTEN_V3_URL = 'https://exodus.stockbit.com/emitten/v3'; // New base URL for emitten v3 API

// Custom error for token expiry - allows UI to detect and show refresh prompt
export class TokenExpiredError extends Error {
  constructor(message: string = 'Token has expired or is invalid. Please login to Stockbit again.') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

// Cache token to reduce database calls
let cachedToken: string | null = null;
let tokenLastFetched: number = 0;
const TOKEN_CACHE_DURATION = 60000; // 1 minute

// Cache sector data to reduce API calls
// Updated type to include 'name'
const sectorCache = new Map<string, { sector: string; name: string; timestamp: number }>();
const SECTOR_CACHE_DURATION = 3600000; // 1 hour

// Static list of IDX sectors with their IDs and parent ID (70 for all main sectors)
const STATIC_IDX_SECTORS_DATA: IdxSector[] = [
  { id: "1000003292", name: "IDXBASIC", alias1: "IDXBASIC", parent: "70" },
  { id: "1000003293", name: "IDXCYCLIC", alias1: "IDXCYCLIC", parent: "70" },
  { id: "1000003294", name: "IDXENERGY", alias1: "IDXENERGY", parent: "70" },
  { id: "1000003295", name: "IDXFINANCE", alias1: "IDXFINANCE", parent: "70" },
  { id: "1000003296", name: "IDXHEALTH", alias1: "IDXHEALTH", parent: "70" },
  { id: "1000003297", name: "IDXINDUST", alias1: "IDXINDUST", parent: "70" },
  { id: "1000003298", name: "IDXINFRA", alias1: "IDXINFRA", parent: "70" },
  { id: "1000003299", name: "IDXNONCYC", alias1: "IDXNONCYC", parent: "70" },
  { id: "1000003300", name: "IDXPROPERT", alias1: "IDXPROPERT", parent: "70" },
  { id: "1000003301", name: "IDXTECHNO", alias1: "IDXTECHNO", parent: "70" },
  { id: "1000003302", name: "IDXTRANS", alias1: "IDXTRANS", parent: "70" },
  { id: "628", name: "Syariah", alias1: "Syariah", parent: "70" }
];

/**
 * Get JWT token from database or environment
 */
async function getAuthToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && (now - tokenLastFetched) < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }

  // Fetch from database
  const token = await getSessionValue('stockbit_token');

  // Fallback to env if database token not found
  if (!token) {
    const envToken = process.env.STOCKBIT_JWT_TOKEN;
    if (!envToken) {
      throw new Error('STOCKBIT_JWT_TOKEN not found in database or environment');
    }
    return envToken;
  }

  // Update cache
  cachedToken = token;
  tokenLastFetched = now;

  return cachedToken;
}

/**
 * Common headers for Stockbit API
 */
async function getHeaders(): Promise<HeadersInit> {
  return {
    'accept': 'application/json',
    'authorization': `Bearer ${await getAuthToken()}`,
    'origin': 'https://stockbit.com',
    'referer': 'https://stockbit.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/533.36',
  };
}

/**
 * Handle API response - check for 401 and update token status
 */
async function handleApiResponse(response: Response, apiName: string): Promise<void> {
  if (response.status === 401) {
    // Token is invalid - mark it and clear cache
    cachedToken = null; // Clear cache
    throw new TokenExpiredError(`${apiName}: Token expired or invalid (401)`);
  }
  
  if (!response.ok) {
    throw new Error(`${apiName} error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Fetch Market Detector data (broker information)
 */
export async function fetchMarketDetector(
  emiten: string,
  fromDate: string,
  toDate: string
): Promise<MarketDetectorResponse> {
  const url = new URL(`${STOCKBIT_BASE_URL}/marketdetectors/${emiten}`);
  url.searchParams.append('from', fromDate);
  url.searchParams.append('to', toDate);
  url.searchParams.append('transaction_type', 'TRANSACTION_TYPE_NET');
  url.searchParams.append('market_board', 'MARKET_BOARD_REGULER');
  url.searchParams.append('investor_type', 'INVESTOR_TYPE_ALL');
  url.searchParams.append('limit', '25');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'Market Detector API');

  return response.json();
}

/**
 * Fetch Orderbook data (market data)
 */
export async function fetchOrderbook(emiten: string): Promise<OrderbookResponse> {
  const url = `${STOCKBIT_BASE_URL}/company-price-feed/v2/orderbook/companies/${emiten}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'Orderbook API');

  return response.json();
}

/**
 * Fetch Emiten Info (including sector)
 */
export async function fetchEmitenInfo(emiten: string): Promise<EmitenInfoResponse> {
  // Check cache first
  const cached = sectorCache.get(emiten.toUpperCase());
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < SECTOR_CACHE_DURATION) {
    // Return cached data in the expected format, including the cached name
    return {
      data: {
        sector: cached.sector,
        sub_sector: '',
        symbol: emiten,
        name: cached.name, // Use cached name
        price: '0',
        change: '0',
        percentage: 0,
      },
      message: 'Successfully retrieved company data (cached)',
    };
  }

  const url = `${STOCKBIT_BASE_URL}/emitten/${emiten}/info`;

  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'Emiten Info API');

  const data: EmitenInfoResponse = await response.json();
  
  // Cache the sector and name data
  if (data.data?.sector && data.data?.name) {
    sectorCache.set(emiten.toUpperCase(), {
      sector: data.data.sector,
      name: data.data.name, // Store the name
      timestamp: now,
    });
  }

  return data;
}

/**
 * Fetch detailed information for an IDX sector.
 */
export async function fetchIdxSectorInfo(symbol: string): Promise<EmitenInfoResponse> {
  // Use the new orderbook API for IDX indices
  const url = `${STOCKBIT_ORDERBOOK_API_URL}/${symbol}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `IDX Sector Info API (${symbol})`);

  const json = await response.json();

  // Safely get data, or provide a default empty object if json.data is null/undefined
  const apiData = json.data || {};

  return {
    data: {
      sector: apiData.name || symbol, // Use name as sector for indices
      sub_sector: '', // Not available in this API for indices
      symbol: apiData.symbol || symbol,
      name: apiData.name || symbol,
      price: String(apiData.close || 0), // Provide default for numbers
      change: String(apiData.change || 0),
      percentage: apiData.percentage_change || 0,
      volume: String(apiData.volume || 0),
      average: String(apiData.average || 0),
      followers: apiData.followers || 0,
      date: apiData.date || new Date().toISOString().split('T')[0],
      time: apiData.time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      exchange: apiData.exchange || 'N/A',
      country: apiData.country || 'N/A',
      type_company: apiData.company_type || 'N/A',
      fnet: apiData.fnet || 0, // Provide default for numbers
      fbuy: apiData.fbuy || 0,
      fsell: apiData.fsell || 0,
      domestic: apiData.domestic || '0',
      foreign: apiData.foreign || '0',
    },
    message: json.message || 'Successfully retrieved company orderbook',
  };
}

/**
 * Fetch all sectors list (now returns static data with IDs)
 */
export async function fetchSectors(): Promise<IdxSector[]> {
  return STATIC_IDX_SECTORS_DATA;
}

/**
 * Fetch companies for a specific IDX sector.
 * The API uses a generic parent ID (70) and the sector's actual ID as 'subsectorId'.
 */
export async function fetchIdxSectorCompanies(sectorId: string, subsectorId: string): Promise<IdxSectorCompaniesResponse> {
  const url = `${STOCKBIT_EMITTEN_V3_URL}/sector/${sectorId}/subsector/${subsectorId}/company`;

  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `IDX Sector Companies API (${sectorId}/${subsectorId})`);

  return response.json();
}

/**
 * Fetch all watchlist groups
 */
export async function fetchWatchlistGroups(): Promise<WatchlistGroup[]> {
  const url = `${STOCKBIT_BASE_URL}/watchlist?page=1&limit=500`;
  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'Watchlist Groups API');

  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
}

/**
 * Fetch Watchlist data by ID (or default if not provided)
 */
export async function fetchWatchlist(watchlistId?: number): Promise<WatchlistResponse> {
  let id = watchlistId;

  // If no ID provided, get default watchlist ID
  if (!id) {
    const groups = await fetchWatchlistGroups();
    const defaultGroup = groups.find(w => w.is_default) || groups[0];
    id = defaultGroup?.watchlist_id;
    if (!id) throw new Error('No watchlist found');
  }

  // Fetch watchlist details
  const detailUrl = `${STOCKBIT_BASE_URL}/watchlist/${id}?page=1&limit=500`;
  const response = await fetch(detailUrl, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'Watchlist Detail API');

  const json = await response.json();

  // Map symbol to company_code for compatibility
  if (json.data?.result) {
    json.data.result = json.data.result.map((item: any) => ({
      ...item,
      company_code: item.symbol || item.company_code
    }));
  }

  return json;
}

/**
 * Get top broker by BVAL from Market Detector response
 */
export function getTopBroker(marketDetectorData: MarketDetectorResponse): BrokerData | null {
  // Debug log to see actual API response structure
  // console.log('Market Detector API Response:', JSON.stringify(marketDetectorData, null, 2));

  // The actual data is wrapped in 'data' property
  const brokers = marketDetectorData?.data?.broker_summary?.brokers_buy;

  if (!brokers || !Array.isArray(brokers) || brokers.length === 0) {
    // Return null instead of throwing error to allow caller to handle gracefully
    return null;
  }

  // Sort by bval descending and get the first one
  // Note: bval is a string in the API response, so we convert to Number
  const topBroker = [...brokers].sort((a, b) => Number(b.bval) - Number(a.bval))[0];

  return {
    bandar: topBroker.netbs_broker_code,
    barangBandar: Math.round(Number(topBroker.blot)),
    rataRataBandar: Math.round(Number(topBroker.netbs_buy_avg_price)),
  };
}

/**
 * Helper to parse lot string (e.g., "25,322,000" -> 25322000)
 */
export function parseLot(lotStr: string): number {
  if (!lotStr) return 0;
  return Number(lotStr.replace(/,/g, ''));
}

/**
 * Get broker summary data from Market Detector response
 */
export function getBrokerSummary(marketDetectorData: MarketDetectorResponse): BrokerSummaryData {
  const detector = marketDetectorData?.data?.bandar_detector;
  const brokerSummary = marketDetectorData?.data?.broker_summary;

  // Provide safe defaults if data is missing
  return {
    detector: {
      average: detector?.average || 0,
      avg: detector?.avg || { vol: 0, percent: 0, amount: 0, accdist: '-' },
      avg5: detector?.avg5 || { vol: 0, percent: 0, amount: 0, accdist: '-' }, // Added avg5
      broker_accdist: detector?.broker_accdist || '-',
      number_broker_buysell: detector?.number_broker_buysell || 0,
      top1: detector?.top1 || { vol: 0, percent: 0, amount: 0, accdist: '-' },
      top3: detector?.top3 || { vol: 0, percent: 0, amount: 0, accdist: '-' },
      top5: detector?.top5 || { vol: 0, percent: 0, amount: 0, accdist: '-' },
      top10: detector?.top10 || { vol: 0, percent: 0, amount: 0, accdist: '-' }, // Added top10
      total_buyer: detector?.total_buyer || 0,
      total_seller: detector?.total_seller || 0,
      value: detector?.value || 0,
      volume: detector?.volume || 0,
    },
    topBuyers: brokerSummary?.brokers_buy?.slice(0, 4) || [],
        topSellers: brokerSummary?.brokers_sell?.slice(0, 4) || [],
  };
}

/**
 * Parse KeyStats API response into structured data
 */
function parseKeyStatsResponse(json: KeyStatsResponse): KeyStatsData {
  const categories = json.data?.closure_fin_items_results || [];
  
  const findCategory = (name: string): KeyStatsItem[] => {
    const category = categories.find(c => c.keystats_name === name);
    if (!category) return [];
    return category.fin_name_results.map(r => r.fitem);
  };

  return {
    perShare: findCategory('Per Share'), // New category
    currentValuation: findCategory('Current Valuation'),
    incomeStatement: findCategory('Income Statement'),
    balanceSheet: findCategory('Balance Sheet'),
    profitability: findCategory('Profitability'),
    growth: findCategory('Growth'),
  };
}

/**
 * Fetch KeyStats data for a stock
 */
export async function fetchKeyStats(emiten: string): Promise<KeyStatsData> {
  const url = `${STOCKBIT_BASE_URL}/keystats/ratio/v1/${emiten}?year_limit=10`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, 'KeyStats API');

  const json: KeyStatsResponse = await response.json();
  return parseKeyStatsResponse(json);
}

/**
 * Fetch Trade Book data for a specific symbol
 */
export async function fetchTradeBook(symbol: string): Promise<TradeBookTotal | null> {
  const url = new URL(`${STOCKBIT_BASE_URL}/order-trade/trade-book`);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('group_by', 'GROUP_BY_TIME');
  url.searchParams.append('time_interval', '10m'); // Using 10m as per example

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getHeaders(),
    });

    await handleApiResponse(response, `Trade Book API (${symbol})`);

    const json: TradeBookResponse = await response.json();
    return json.data?.book_total || null;
  } catch (error) {
    console.error(`Error fetching trade book for ${symbol}:`, error);
    return null; // Return null on error to not block market movers
  }
}

/**
 * Fetch Market Movers data (Top Gainer, Loser, Value, Volume, Frequency, Net Foreign Buy)
 */
export async function fetchMarketMovers(type: MarketMoverType, limit: number = 20): Promise<MarketMoverItem[]> {
  const moverTypeMap: Record<MarketMoverType, string> = {
    gainer: 'MOVER_TYPE_TOP_GAINER',
    loser: 'MOVER_TYPE_TOP_LOSER',
    value: 'MOVER_TYPE_TOP_VALUE',
    volume: 'MOVER_TYPE_TOP_VOLUME',
    frequency: 'MOVER_TYPE_TOP_FREQUENCY',
    'net-foreign-buy': 'MOVER_TYPE_NET_FOREIGN_BUY', // Added new type
  };

  const url = new URL(`${STOCKBIT_BASE_URL}/order-trade/market-mover`);
  url.searchParams.append('mover_type', moverTypeMap[type]);
  url.searchParams.append('filter_stocks', 'FILTER_STOCKS_TYPE_MAIN_BOARD');
  url.searchParams.append('filter_stocks', 'FILTER_STOCKS_TYPE_DEVELOPMENT_BOARD'); // Corrected line
  url.searchParams.append('filter_stocks', 'FILTER_STOCKS_TYPE_ACCELERATION_BOARD');
  url.searchParams.append('filter_stocks', 'FILTER_STOCKS_TYPE_NEW_ECONOMY_BOARD');
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `Market Movers API (${type})`);

  const json: MarketMoversResponse = await response.json();
  
  // Map the new response structure to the existing MarketMoverItem interface
  const mappedMovers: MarketMoverItem[] = json.data.mover_list.map((item: any) => ({
    symbol: item.stock_detail.code,
    name: item.stock_detail.name,
    last_price: item.price,
    change_point: item.change.value,
    change_percentage: item.change.percentage,
    value: item.value.raw,
    volume: item.volume.raw,
    frequency: item.frequency.raw,
    net_foreign_buy: item.net_foreign_buy?.raw || 0,
  }));

  return mappedMovers;
}

/**
 * Fetch Insider Activity data
 */
export async function fetchInsiderActivity(
  emiten: string | undefined, // Changed to be optional
  dateStart: string,
  dateEnd: string,
  actionType: ActionType = "ACTION_TYPE_UNSPECIFIED",
  sourceType: SourceType = "SOURCE_TYPE_UNSPECIFIED",
  page: number = 1,
  limit: number = 20
): Promise<InsiderActivityResponse> {
  const url = new URL(`${STOCKBIT_BASE_URL}/insider/company/majorholder`);
  if (emiten) { // Only append if emiten is provided
    url.searchParams.append('symbol', emiten);
  }
  url.searchParams.append('date_start', dateStart);
  url.searchParams.append('date_end', dateEnd);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('action_type', actionType);
  url.searchParams.append('source_type', sourceType);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `Insider Activity API (${emiten || 'All Stocks'})`);

  return response.json();
}

/**
 * Fetch Broker Activity Detail for a specific broker
 */
export async function fetchBrokerActivityDetail(
  brokerCode: string,
  fromDate: string,
  toDate: string,
  page: number = 1, // Page and limit are likely ignored by this endpoint, but kept for consistency
  limit: number = 50,
  transactionType: string = 'TRANSACTION_TYPE_NET',
  marketBoard: string = 'MARKET_BOARD_REGULER',
  investorType: string = 'INVESTOR_TYPE_ALL'
): Promise<BrokerOverallActivitySummaryResponse> { // Changed return type
  const url = new URL(`${STOCKBIT_FINDATA_VIEW_URL}/marketdetectors/activity/${brokerCode}/detail`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('from', fromDate);
  url.searchParams.append('to', toDate);
  url.searchParams.append('transaction_type', transactionType);
  url.searchParams.append('market_board', marketBoard);
  url.searchParams.append('investor_type', investorType);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `Broker Activity Detail API (${brokerCode})`);

  const json: BrokerOverallActivitySummaryResponse = await response.json();

  // Add logging for empty data
  if (!json.data || !json.data.broker_summary || (!json.data.broker_summary.brokers_buy.length && !json.data.broker_summary.brokers_sell.length)) {
    console.warn(`[Stockbit API] No broker activity data found for ${brokerCode} from ${fromDate} to ${toDate}`);
  }

  return json;
}

/**
 * Fetch stock search results from Stockbit.
 */
export async function fetchStockbitSearch(keyword: string, limit: number = 10): Promise<StockbitSearchCompanyItem[]> {
  if (!keyword) return [];

  const url = new URL(`${STOCKBIT_BASE_URL}/search`);
  url.searchParams.append('keyword', keyword);
  url.searchParams.append('page', '1');
  url.searchParams.append('type', 'company'); // Filter for company type
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `Stockbit Search API (${keyword})`);

  const json: StockbitSearchResponse = await response.json();
  
  // Return all company items without further filtering
  return json.data.company;
}

/**
 * Fetch Top Stock data (Top Buy/Sell)
 */
export async function fetchTopStocks(
  startDate: string,
  endDate: string,
  investorType: string = 'INVESTOR_TYPE_ALL',
  marketType: string = 'MARKET_BOARD_REGULER',
  valueType: string = 'VALUE_TYPE_NET',
  page: number = 1,
  limit: number = 100
): Promise<TopStockResponse> {
  const url = new URL(`${STOCKBIT_BASE_URL}/order-trade/top-stock`);
  url.searchParams.append('start', startDate);
  url.searchParams.append('end', endDate);
  url.searchParams.append('investor_type', investorType);
  url.searchParams.append('market_type', marketType);
  url.searchParams.append('value_type', valueType);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: await getHeaders(),
  });

  await handleApiResponse(response, `Top Stock API`);

  return response.json();
}