"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/analyze-watchlist-background.ts
var analyze_watchlist_background_exports = {};
__export(analyze_watchlist_background_exports, {
  default: () => analyze_watchlist_background_default
});
module.exports = __toCommonJS(analyze_watchlist_background_exports);

// lib/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
var supabase = (0, import_supabase_js.createClient)(supabaseUrl, supabaseAnonKey);
async function getSessionValue(key) {
  const { data, error } = await supabase.from("session").select("value").eq("key", key).single();
  if (error || !data) return null;
  return data.value;
}
async function saveWatchlistAnalysis(data) {
  const { data: result, error } = await supabase.from("stock_queries").upsert([data], { onConflict: "from_date,emiten" }).select();
  if (error) {
    console.error("Error saving watchlist analysis:", error);
    throw error;
  }
  return result;
}
async function updatePreviousDayRealPrice(emiten, currentDate, price) {
  const { data: record, error: findError } = await supabase.from("stock_queries").select("id, from_date").eq("emiten", emiten).eq("status", "success").lt("from_date", currentDate).order("from_date", { ascending: false }).limit(1).single();
  if (findError || !record) {
    if (findError && findError.code !== "PGRST116") {
      console.error(`Error finding previous record for ${emiten} before ${currentDate}:`, findError);
    }
    return null;
  }
  const { data, error: updateError } = await supabase.from("stock_queries").update({ real_harga: price }).eq("id", record.id).select();
  if (updateError) {
    console.error(`Error updating real_harga for ${emiten} on ${record.from_date}:`, updateError);
  }
  return data;
}

// lib/stockbit.ts
var STOCKBIT_BASE_URL = "https://exodus.stockbit.com";
var cachedToken = null;
var tokenLastFetched = 0;
var TOKEN_CACHE_DURATION = 6e4;
var sectorCache = /* @__PURE__ */ new Map();
var SECTOR_CACHE_DURATION = 36e5;
async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && now - tokenLastFetched < TOKEN_CACHE_DURATION) {
    return cachedToken;
  }
  const token = await getSessionValue("stockbit_token");
  if (!token) {
    const envToken = process.env.STOCKBIT_JWT_TOKEN;
    if (!envToken) {
      throw new Error("STOCKBIT_JWT_TOKEN not found in database or environment");
    }
    return envToken;
  }
  cachedToken = token;
  tokenLastFetched = now;
  return token;
}
async function getHeaders() {
  return {
    "accept": "application/json",
    "authorization": `Bearer ${await getAuthToken()}`,
    "origin": "https://stockbit.com",
    "referer": "https://stockbit.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
  };
}
async function fetchMarketDetector(emiten, fromDate, toDate) {
  const url = new URL(`${STOCKBIT_BASE_URL}/marketdetectors/${emiten}`);
  url.searchParams.append("from", fromDate);
  url.searchParams.append("to", toDate);
  url.searchParams.append("transaction_type", "TRANSACTION_TYPE_NET");
  url.searchParams.append("market_board", "MARKET_BOARD_REGULER");
  url.searchParams.append("investor_type", "INVESTOR_TYPE_ALL");
  url.searchParams.append("limit", "25");
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: await getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Market Detector API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchOrderbook(emiten) {
  const url = `${STOCKBIT_BASE_URL}/company-price-feed/v2/orderbook/companies/${emiten}`;
  const response = await fetch(url, {
    method: "GET",
    headers: await getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Orderbook API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchEmitenInfo(emiten) {
  const cached = sectorCache.get(emiten.toUpperCase());
  const now = Date.now();
  if (cached && now - cached.timestamp < SECTOR_CACHE_DURATION) {
    return {
      data: {
        sector: cached.sector,
        sub_sector: "",
        symbol: emiten,
        name: "",
        price: "0",
        change: "0",
        percentage: 0
      },
      message: "Successfully retrieved company data (cached)"
    };
  }
  const url = `${STOCKBIT_BASE_URL}/emitten/${emiten}/info`;
  const response = await fetch(url, {
    method: "GET",
    headers: await getHeaders()
  });
  if (!response.ok) {
    throw new Error(`Emiten Info API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.data?.sector) {
    sectorCache.set(emiten.toUpperCase(), {
      sector: data.data.sector,
      timestamp: now
    });
  }
  return data;
}
async function fetchWatchlist() {
  const metaUrl = `${STOCKBIT_BASE_URL}/watchlist?page=1&limit=500`;
  const metaResponse = await fetch(metaUrl, {
    method: "GET",
    headers: await getHeaders()
  });
  if (!metaResponse.ok) {
    throw new Error(`Watchlist Meta API error: ${metaResponse.status} ${metaResponse.statusText}`);
  }
  const metaJson = await metaResponse.json();
  const watchlists = Array.isArray(metaJson.data) ? metaJson.data : [metaJson.data];
  const defaultWatchlist = watchlists.find((w) => w.is_default) || watchlists[0];
  const watchlistId = defaultWatchlist?.watchlist_id;
  if (!watchlistId) {
    throw new Error(`No watchlist_id found in response: ${JSON.stringify(metaJson)}`);
  }
  const detailUrl = `${STOCKBIT_BASE_URL}/watchlist/${watchlistId}?page=1&limit=500`;
  const detailResponse = await fetch(detailUrl, {
    method: "GET",
    headers: await getHeaders()
  });
  if (!detailResponse.ok) {
    throw new Error(`Watchlist Detail API error: ${detailResponse.status} ${detailResponse.statusText}`);
  }
  const detailJson = await detailResponse.json();
  if (detailJson.data?.result) {
    detailJson.data.result = detailJson.data.result.map((item) => ({
      ...item,
      company_code: item.symbol || item.company_code
    }));
  }
  return detailJson;
}
function getTopBroker(marketDetectorData) {
  const brokers = marketDetectorData?.data?.broker_summary?.brokers_buy;
  if (!brokers || !Array.isArray(brokers) || brokers.length === 0) {
    return null;
  }
  const topBroker = [...brokers].sort((a, b) => Number(b.bval) - Number(a.bval))[0];
  return {
    bandar: topBroker.netbs_broker_code,
    barangBandar: Math.round(Number(topBroker.blot)),
    rataRataBandar: Math.round(Number(topBroker.netbs_buy_avg_price))
  };
}

// lib/calculations.ts
function getFraksi(harga) {
  if (harga < 200) return 1;
  if (harga >= 200 && harga < 500) return 2;
  if (harga >= 500 && harga < 2e3) return 5;
  if (harga >= 2e3 && harga < 5e3) return 10;
  return 25;
}
function calculateTargets(rataRataBandar, barangBandar, ara, arb, totalBid, totalOffer, harga) {
  const fraksi = getFraksi(harga);
  const totalPapan = (ara - arb) / fraksi;
  const rataRataBidOfer = (totalBid + totalOffer) / totalPapan;
  const a = rataRataBandar * 0.05;
  const p = barangBandar / rataRataBidOfer;
  const targetRealistis1 = rataRataBandar + a + p / 2 * fraksi;
  const targetMax = rataRataBandar + a + p * fraksi;
  return {
    fraksi,
    totalPapan: Math.round(totalPapan),
    rataRataBidOfer: Math.round(rataRataBidOfer),
    a: Math.round(a),
    p: Math.round(p),
    targetRealistis1: Math.round(targetRealistis1),
    targetMax: Math.round(targetMax)
  };
}

// netlify/functions/analyze-watchlist-background.ts
var analyze_watchlist_background_default = async (req) => {
  const startTime = Date.now();
  console.log("[Background] Starting analysis job...");
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const watchlistResponse = await fetchWatchlist();
    const watchlistItems = watchlistResponse.data?.result || [];
    if (watchlistItems.length === 0) {
      console.log("[Background] No watchlist items to analyze");
      return new Response(JSON.stringify({ success: true, message: "No items" }), { status: 200 });
    }
    const results = [];
    const errors = [];
    for (const item of watchlistItems) {
      const emiten = item.symbol || item.company_code;
      console.log(`[Background] Analyzing ${emiten}...`);
      try {
        const [marketDetectorData, orderbookData, emitenInfoData] = await Promise.all([
          fetchMarketDetector(emiten, today, today),
          fetchOrderbook(emiten),
          fetchEmitenInfo(emiten).catch(() => null)
        ]);
        const brokerData = getTopBroker(marketDetectorData);
        if (!brokerData) {
          errors.push({ emiten, error: "No broker data" });
          continue;
        }
        const sector = emitenInfoData?.data?.sector || void 0;
        const obData = orderbookData.data || orderbookData;
        const offerPrices = (obData.offer || []).map((o) => Number(o.price));
        const bidPrices = (obData.bid || []).map((b) => Number(b.price));
        const marketData = {
          harga: Number(obData.close),
          offerTeratas: offerPrices.length > 0 ? Math.max(...offerPrices) : Number(obData.high || 0),
          bidTerbawah: bidPrices.length > 0 ? Math.min(...bidPrices) : 0,
          totalBid: Number(obData.total_bid_offer.bid.lot.replace(/,/g, "")),
          totalOffer: Number(obData.total_bid_offer.offer.lot.replace(/,/g, ""))
        };
        const calculated = calculateTargets(
          brokerData.rataRataBandar,
          brokerData.barangBandar,
          marketData.offerTeratas,
          marketData.bidTerbawah,
          marketData.totalBid / 100,
          marketData.totalOffer / 100,
          marketData.harga
        );
        await saveWatchlistAnalysis({
          from_date: today,
          to_date: today,
          emiten,
          sector,
          bandar: brokerData.bandar,
          barang_bandar: brokerData.barangBandar,
          rata_rata_bandar: brokerData.rataRataBandar,
          harga: marketData.harga,
          ara: marketData.offerTeratas,
          arb: marketData.bidTerbawah,
          fraksi: calculated.fraksi,
          total_bid: marketData.totalBid,
          total_offer: marketData.totalOffer,
          total_papan: calculated.totalPapan,
          rata_rata_bid_ofer: calculated.rataRataBidOfer,
          a: calculated.a,
          p: calculated.p,
          target_realistis: calculated.targetRealistis1,
          target_max: calculated.targetMax,
          status: "success"
        });
        try {
          await updatePreviousDayRealPrice(emiten, today, marketData.harga);
        } catch (updateError) {
          console.error(`[Background] Failed to update price for ${emiten}`, updateError);
        }
        results.push({ emiten, status: "success" });
      } catch (error) {
        console.error(`[Background] Error analyzing ${emiten}:`, error);
        errors.push({ emiten, error: String(error) });
      }
    }
    const duration = (Date.now() - startTime) / 1e3;
    console.log(`[Background] Job completed in ${duration}s. Success: ${results.length}, Errors: ${errors.length}`);
    return new Response(JSON.stringify({ success: true, results: results.length, errors: errors.length }), { status: 200 });
  } catch (error) {
    console.error("[Background] Critical error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500 });
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYW5hbHl6ZS13YXRjaGxpc3QtYmFja2dyb3VuZC50cyIsICJsaWIvc3VwYWJhc2UudHMiLCAibGliL3N0b2NrYml0LnRzIiwgImxpYi9jYWxjdWxhdGlvbnMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGZldGNoV2F0Y2hsaXN0LCBmZXRjaE1hcmtldERldGVjdG9yLCBmZXRjaE9yZGVyYm9vaywgZ2V0VG9wQnJva2VyLCBmZXRjaEVtaXRlbkluZm8gfSBmcm9tICcuLi8uLi9saWIvc3RvY2tiaXQnO1xyXG5pbXBvcnQgeyBjYWxjdWxhdGVUYXJnZXRzIH0gZnJvbSAnLi4vLi4vbGliL2NhbGN1bGF0aW9ucyc7XHJcbmltcG9ydCB7IHNhdmVXYXRjaGxpc3RBbmFseXNpcywgdXBkYXRlUHJldmlvdXNEYXlSZWFsUHJpY2UgfSBmcm9tICcuLi8uLi9saWIvc3VwYWJhc2UnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCkgPT4ge1xyXG4gIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgY29uc29sZS5sb2coJ1tCYWNrZ3JvdW5kXSBTdGFydGluZyBhbmFseXNpcyBqb2IuLi4nKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIEdldCBjdXJyZW50IGRhdGUgZm9yIGFuYWx5c2lzXHJcbiAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xyXG5cclxuICAgIC8vIEZldGNoIHdhdGNobGlzdFxyXG4gICAgY29uc3Qgd2F0Y2hsaXN0UmVzcG9uc2UgPSBhd2FpdCBmZXRjaFdhdGNobGlzdCgpO1xyXG4gICAgY29uc3Qgd2F0Y2hsaXN0SXRlbXMgPSB3YXRjaGxpc3RSZXNwb25zZS5kYXRhPy5yZXN1bHQgfHwgW107XHJcblxyXG4gICAgaWYgKHdhdGNobGlzdEl0ZW1zLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBjb25zb2xlLmxvZygnW0JhY2tncm91bmRdIE5vIHdhdGNobGlzdCBpdGVtcyB0byBhbmFseXplJyk7XHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTm8gaXRlbXMnIH0pLCB7IHN0YXR1czogMjAwIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcclxuICAgIGNvbnN0IGVycm9ycyA9IFtdO1xyXG5cclxuICAgIC8vIEFuYWx5emUgZWFjaCB3YXRjaGxpc3QgaXRlbVxyXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHdhdGNobGlzdEl0ZW1zKSB7XHJcbiAgICAgIGNvbnN0IGVtaXRlbiA9IGl0ZW0uc3ltYm9sIHx8IGl0ZW0uY29tcGFueV9jb2RlO1xyXG4gICAgICBjb25zb2xlLmxvZyhgW0JhY2tncm91bmRdIEFuYWx5emluZyAke2VtaXRlbn0uLi5gKTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgW21hcmtldERldGVjdG9yRGF0YSwgb3JkZXJib29rRGF0YSwgZW1pdGVuSW5mb0RhdGFdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgICAgZmV0Y2hNYXJrZXREZXRlY3RvcihlbWl0ZW4sIHRvZGF5LCB0b2RheSksXHJcbiAgICAgICAgICBmZXRjaE9yZGVyYm9vayhlbWl0ZW4pLFxyXG4gICAgICAgICAgZmV0Y2hFbWl0ZW5JbmZvKGVtaXRlbikuY2F0Y2goKCkgPT4gbnVsbCksXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJyb2tlckRhdGEgPSBnZXRUb3BCcm9rZXIobWFya2V0RGV0ZWN0b3JEYXRhKTtcclxuICAgICAgICBpZiAoIWJyb2tlckRhdGEpIHtcclxuICAgICAgICAgIGVycm9ycy5wdXNoKHsgZW1pdGVuLCBlcnJvcjogJ05vIGJyb2tlciBkYXRhJyB9KTtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VjdG9yID0gZW1pdGVuSW5mb0RhdGE/LmRhdGE/LnNlY3RvciB8fCB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3Qgb2JEYXRhID0gb3JkZXJib29rRGF0YS5kYXRhIHx8IChvcmRlcmJvb2tEYXRhIGFzIGFueSk7XHJcbiAgICAgICAgY29uc3Qgb2ZmZXJQcmljZXMgPSAob2JEYXRhLm9mZmVyIHx8IFtdKS5tYXAoKG86IGFueSkgPT4gTnVtYmVyKG8ucHJpY2UpKTtcclxuICAgICAgICBjb25zdCBiaWRQcmljZXMgPSAob2JEYXRhLmJpZCB8fCBbXSkubWFwKChiOiBhbnkpID0+IE51bWJlcihiLnByaWNlKSk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1hcmtldERhdGEgPSB7XHJcbiAgICAgICAgICBoYXJnYTogTnVtYmVyKG9iRGF0YS5jbG9zZSksXHJcbiAgICAgICAgICBvZmZlclRlcmF0YXM6IG9mZmVyUHJpY2VzLmxlbmd0aCA+IDAgPyBNYXRoLm1heCguLi5vZmZlclByaWNlcykgOiBOdW1iZXIob2JEYXRhLmhpZ2ggfHwgMCksXHJcbiAgICAgICAgICBiaWRUZXJiYXdhaDogYmlkUHJpY2VzLmxlbmd0aCA+IDAgPyBNYXRoLm1pbiguLi5iaWRQcmljZXMpIDogMCxcclxuICAgICAgICAgIHRvdGFsQmlkOiBOdW1iZXIob2JEYXRhLnRvdGFsX2JpZF9vZmZlci5iaWQubG90LnJlcGxhY2UoLywvZywgJycpKSxcclxuICAgICAgICAgIHRvdGFsT2ZmZXI6IE51bWJlcihvYkRhdGEudG90YWxfYmlkX29mZmVyLm9mZmVyLmxvdC5yZXBsYWNlKC8sL2csICcnKSksXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgY2FsY3VsYXRlZCA9IGNhbGN1bGF0ZVRhcmdldHMoXHJcbiAgICAgICAgICBicm9rZXJEYXRhLnJhdGFSYXRhQmFuZGFyLFxyXG4gICAgICAgICAgYnJva2VyRGF0YS5iYXJhbmdCYW5kYXIsXHJcbiAgICAgICAgICBtYXJrZXREYXRhLm9mZmVyVGVyYXRhcyxcclxuICAgICAgICAgIG1hcmtldERhdGEuYmlkVGVyYmF3YWgsXHJcbiAgICAgICAgICBtYXJrZXREYXRhLnRvdGFsQmlkIC8gMTAwLFxyXG4gICAgICAgICAgbWFya2V0RGF0YS50b3RhbE9mZmVyIC8gMTAwLFxyXG4gICAgICAgICAgbWFya2V0RGF0YS5oYXJnYVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGF3YWl0IHNhdmVXYXRjaGxpc3RBbmFseXNpcyh7XHJcbiAgICAgICAgICBmcm9tX2RhdGU6IHRvZGF5LFxyXG4gICAgICAgICAgdG9fZGF0ZTogdG9kYXksXHJcbiAgICAgICAgICBlbWl0ZW4sXHJcbiAgICAgICAgICBzZWN0b3IsXHJcbiAgICAgICAgICBiYW5kYXI6IGJyb2tlckRhdGEuYmFuZGFyLFxyXG4gICAgICAgICAgYmFyYW5nX2JhbmRhcjogYnJva2VyRGF0YS5iYXJhbmdCYW5kYXIsXHJcbiAgICAgICAgICByYXRhX3JhdGFfYmFuZGFyOiBicm9rZXJEYXRhLnJhdGFSYXRhQmFuZGFyLFxyXG4gICAgICAgICAgaGFyZ2E6IG1hcmtldERhdGEuaGFyZ2EsXHJcbiAgICAgICAgICBhcmE6IG1hcmtldERhdGEub2ZmZXJUZXJhdGFzLFxyXG4gICAgICAgICAgYXJiOiBtYXJrZXREYXRhLmJpZFRlcmJhd2FoLFxyXG4gICAgICAgICAgZnJha3NpOiBjYWxjdWxhdGVkLmZyYWtzaSxcclxuICAgICAgICAgIHRvdGFsX2JpZDogbWFya2V0RGF0YS50b3RhbEJpZCxcclxuICAgICAgICAgIHRvdGFsX29mZmVyOiBtYXJrZXREYXRhLnRvdGFsT2ZmZXIsXHJcbiAgICAgICAgICB0b3RhbF9wYXBhbjogY2FsY3VsYXRlZC50b3RhbFBhcGFuLFxyXG4gICAgICAgICAgcmF0YV9yYXRhX2JpZF9vZmVyOiBjYWxjdWxhdGVkLnJhdGFSYXRhQmlkT2ZlcixcclxuICAgICAgICAgIGE6IGNhbGN1bGF0ZWQuYSxcclxuICAgICAgICAgIHA6IGNhbGN1bGF0ZWQucCxcclxuICAgICAgICAgIHRhcmdldF9yZWFsaXN0aXM6IGNhbGN1bGF0ZWQudGFyZ2V0UmVhbGlzdGlzMSxcclxuICAgICAgICAgIHRhcmdldF9tYXg6IGNhbGN1bGF0ZWQudGFyZ2V0TWF4LFxyXG4gICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcydcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGF3YWl0IHVwZGF0ZVByZXZpb3VzRGF5UmVhbFByaWNlKGVtaXRlbiwgdG9kYXksIG1hcmtldERhdGEuaGFyZ2EpO1xyXG4gICAgICAgIH0gY2F0Y2ggKHVwZGF0ZUVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQmFja2dyb3VuZF0gRmFpbGVkIHRvIHVwZGF0ZSBwcmljZSBmb3IgJHtlbWl0ZW59YCwgdXBkYXRlRXJyb3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKHsgZW1pdGVuLCBzdGF0dXM6ICdzdWNjZXNzJyB9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGBbQmFja2dyb3VuZF0gRXJyb3IgYW5hbHl6aW5nICR7ZW1pdGVufTpgLCBlcnJvcik7XHJcbiAgICAgICAgZXJyb3JzLnB1c2goeyBlbWl0ZW4sIGVycm9yOiBTdHJpbmcoZXJyb3IpIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZHVyYXRpb24gPSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwO1xyXG4gICAgY29uc29sZS5sb2coYFtCYWNrZ3JvdW5kXSBKb2IgY29tcGxldGVkIGluICR7ZHVyYXRpb259cy4gU3VjY2VzczogJHtyZXN1bHRzLmxlbmd0aH0sIEVycm9yczogJHtlcnJvcnMubGVuZ3RofWApO1xyXG5cclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZXN1bHRzOiByZXN1bHRzLmxlbmd0aCwgZXJyb3JzOiBlcnJvcnMubGVuZ3RoIH0pLCB7IHN0YXR1czogMjAwIH0pO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignW0JhY2tncm91bmRdIENyaXRpY2FsIGVycm9yOicsIGVycm9yKTtcclxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlcnJvcikgfSksIHsgc3RhdHVzOiA1MDAgfSk7XHJcbiAgfVxyXG59O1xyXG4iLCAiaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJztcclxuXHJcbmNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMITtcclxuY29uc3Qgc3VwYWJhc2VBbm9uS2V5ID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkhO1xyXG5cclxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xyXG5cclxuLyoqXHJcbiAqIFNhdmUgc3RvY2sgcXVlcnkgdG8gZGF0YWJhc2VcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlU3RvY2tRdWVyeShkYXRhOiB7XHJcbiAgZW1pdGVuOiBzdHJpbmc7XHJcbiAgc2VjdG9yPzogc3RyaW5nO1xyXG4gIGZyb21fZGF0ZT86IHN0cmluZztcclxuICB0b19kYXRlPzogc3RyaW5nO1xyXG4gIGJhbmRhcj86IHN0cmluZztcclxuICBiYXJhbmdfYmFuZGFyPzogbnVtYmVyO1xyXG4gIHJhdGFfcmF0YV9iYW5kYXI/OiBudW1iZXI7XHJcbiAgaGFyZ2E/OiBudW1iZXI7XHJcbiAgYXJhPzogbnVtYmVyO1xyXG4gIGFyYj86IG51bWJlcjtcclxuICBmcmFrc2k/OiBudW1iZXI7XHJcbiAgdG90YWxfYmlkPzogbnVtYmVyO1xyXG4gIHRvdGFsX29mZmVyPzogbnVtYmVyO1xyXG4gIHRvdGFsX3BhcGFuPzogbnVtYmVyO1xyXG4gIHJhdGFfcmF0YV9iaWRfb2Zlcj86IG51bWJlcjtcclxuICBhPzogbnVtYmVyO1xyXG4gIHA/OiBudW1iZXI7XHJcbiAgdGFyZ2V0X3JlYWxpc3Rpcz86IG51bWJlcjtcclxuICB0YXJnZXRfbWF4PzogbnVtYmVyO1xyXG59KSB7XHJcbiAgY29uc3QgeyBkYXRhOiByZXN1bHQsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oJ3N0b2NrX3F1ZXJpZXMnKVxyXG4gICAgLnVwc2VydChbZGF0YV0sIHsgb25Db25mbGljdDogJ2Zyb21fZGF0ZSxlbWl0ZW4nIH0pXHJcbiAgICAuc2VsZWN0KCk7XHJcblxyXG4gIGlmIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc2F2aW5nIHRvIFN1cGFiYXNlOicsIGVycm9yKTtcclxuICAgIHRocm93IGVycm9yO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCBzZXNzaW9uIHZhbHVlIGJ5IGtleVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlc3Npb25WYWx1ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbSgnc2Vzc2lvbicpXHJcbiAgICAuc2VsZWN0KCd2YWx1ZScpXHJcbiAgICAuZXEoJ2tleScsIGtleSlcclxuICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgaWYgKGVycm9yIHx8ICFkYXRhKSByZXR1cm4gbnVsbDtcclxuICByZXR1cm4gZGF0YS52YWx1ZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwc2VydCBzZXNzaW9uIHZhbHVlXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBzZXJ0U2Vzc2lvbihrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbSgnc2Vzc2lvbicpXHJcbiAgICAudXBzZXJ0KFxyXG4gICAgICB7IGtleSwgdmFsdWUsIHVwZGF0ZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9LFxyXG4gICAgICB7IG9uQ29uZmxpY3Q6ICdrZXknIH1cclxuICAgIClcclxuICAgIC5zZWxlY3QoKTtcclxuXHJcbiAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcclxuICByZXR1cm4gZGF0YTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmUgd2F0Y2hsaXN0IGFuYWx5c2lzIHRvIGRhdGFiYXNlIChyZXVzaW5nIHN0b2NrX3F1ZXJpZXMgdGFibGUpXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVdhdGNobGlzdEFuYWx5c2lzKGRhdGE6IHtcclxuICBmcm9tX2RhdGU6IHN0cmluZzsgIC8vIGFuYWx5c2lzIGRhdGVcclxuICB0b19kYXRlOiBzdHJpbmc7ICAgIC8vIHNhbWUgYXMgZnJvbV9kYXRlIGZvciBkYWlseSBhbmFseXNpc1xyXG4gIGVtaXRlbjogc3RyaW5nO1xyXG4gIHNlY3Rvcj86IHN0cmluZztcclxuICBiYW5kYXI/OiBzdHJpbmc7XHJcbiAgYmFyYW5nX2JhbmRhcj86IG51bWJlcjtcclxuICByYXRhX3JhdGFfYmFuZGFyPzogbnVtYmVyO1xyXG4gIGhhcmdhPzogbnVtYmVyO1xyXG4gIGFyYT86IG51bWJlcjsgICAgICAgLy8gb2ZmZXJfdGVyYXRhc1xyXG4gIGFyYj86IG51bWJlcjsgICAgICAgLy8gYmlkX3RlcmJhd2FoXHJcbiAgZnJha3NpPzogbnVtYmVyO1xyXG4gIHRvdGFsX2JpZD86IG51bWJlcjtcclxuICB0b3RhbF9vZmZlcj86IG51bWJlcjtcclxuICB0b3RhbF9wYXBhbj86IG51bWJlcjtcclxuICByYXRhX3JhdGFfYmlkX29mZXI/OiBudW1iZXI7XHJcbiAgYT86IG51bWJlcjtcclxuICBwPzogbnVtYmVyO1xyXG4gIHRhcmdldF9yZWFsaXN0aXM/OiBudW1iZXI7XHJcbiAgdGFyZ2V0X21heD86IG51bWJlcjtcclxuICBzdGF0dXM/OiBzdHJpbmc7XHJcbiAgZXJyb3JfbWVzc2FnZT86IHN0cmluZztcclxufSkge1xyXG4gIGNvbnN0IHsgZGF0YTogcmVzdWx0LCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKCdzdG9ja19xdWVyaWVzJylcclxuICAgIC51cHNlcnQoW2RhdGFdLCB7IG9uQ29uZmxpY3Q6ICdmcm9tX2RhdGUsZW1pdGVuJyB9KVxyXG4gICAgLnNlbGVjdCgpO1xyXG5cclxuICBpZiAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNhdmluZyB3YXRjaGxpc3QgYW5hbHlzaXM6JywgZXJyb3IpO1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IHdhdGNobGlzdCBhbmFseXNpcyBoaXN0b3J5IHdpdGggb3B0aW9uYWwgZmlsdGVyc1xyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFdhdGNobGlzdEFuYWx5c2lzSGlzdG9yeShmaWx0ZXJzPzoge1xyXG4gIGVtaXRlbj86IHN0cmluZztcclxuICBzZWN0b3I/OiBzdHJpbmc7XHJcbiAgZnJvbURhdGU/OiBzdHJpbmc7XHJcbiAgdG9EYXRlPzogc3RyaW5nO1xyXG4gIHN0YXR1cz86IHN0cmluZztcclxuICBsaW1pdD86IG51bWJlcjtcclxuICBvZmZzZXQ/OiBudW1iZXI7XHJcbiAgc29ydEJ5Pzogc3RyaW5nO1xyXG4gIHNvcnRPcmRlcj86ICdhc2MnIHwgJ2Rlc2MnO1xyXG59KSB7XHJcbiAgbGV0IHF1ZXJ5ID0gc3VwYWJhc2VcclxuICAgIC5mcm9tKCdzdG9ja19xdWVyaWVzJylcclxuICAgIC5zZWxlY3QoJyonLCB7IGNvdW50OiAnZXhhY3QnIH0pO1xyXG5cclxuICAvLyBIYW5kbGUgc29ydGluZ1xyXG4gIGNvbnN0IHNvcnRCeSA9IGZpbHRlcnM/LnNvcnRCeSB8fCAnZnJvbV9kYXRlJztcclxuICBjb25zdCBzb3J0T3JkZXIgPSBmaWx0ZXJzPy5zb3J0T3JkZXIgfHwgJ2Rlc2MnO1xyXG5cclxuICBpZiAoc29ydEJ5ID09PSAnY29tYmluZWQnKSB7XHJcbiAgICAvLyBTb3J0IGJ5IGRhdGUgdGhlbiBlbWl0ZW5cclxuICAgIHF1ZXJ5ID0gcXVlcnlcclxuICAgICAgLm9yZGVyKCdmcm9tX2RhdGUnLCB7IGFzY2VuZGluZzogc29ydE9yZGVyID09PSAnYXNjJyB9KVxyXG4gICAgICAub3JkZXIoJ2VtaXRlbicsIHsgYXNjZW5kaW5nOiBzb3J0T3JkZXIgPT09ICdhc2MnIH0pO1xyXG4gIH0gZWxzZSBpZiAoc29ydEJ5ID09PSAnZW1pdGVuJykge1xyXG4gICAgLy8gV2hlbiBzb3J0aW5nIGJ5IGVtaXRlbiwgc2Vjb25kYXJ5IHNvcnQgYnkgZGF0ZSBhc2NlbmRpbmdcclxuICAgIHF1ZXJ5ID0gcXVlcnlcclxuICAgICAgLm9yZGVyKCdlbWl0ZW4nLCB7IGFzY2VuZGluZzogc29ydE9yZGVyID09PSAnYXNjJyB9KVxyXG4gICAgICAub3JkZXIoJ2Zyb21fZGF0ZScsIHsgYXNjZW5kaW5nOiB0cnVlIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBxdWVyeSA9IHF1ZXJ5Lm9yZGVyKHNvcnRCeSwgeyBhc2NlbmRpbmc6IHNvcnRPcmRlciA9PT0gJ2FzYycgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAoZmlsdGVycz8uZW1pdGVuKSB7XHJcbiAgICBjb25zdCBlbWl0ZW5MaXN0ID0gZmlsdGVycy5lbWl0ZW4uc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgICBpZiAoZW1pdGVuTGlzdC5sZW5ndGggPiAwKSB7IC8vIENoYW5nZWQgdG8gYWx3YXlzIHVzZSAuaW4oKSBpZiBlbWl0ZW5zIGFyZSBwcmVzZW50XHJcbiAgICAgIHF1ZXJ5ID0gcXVlcnkuaW4oJ2VtaXRlbicsIGVtaXRlbkxpc3QpO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoZmlsdGVycz8uc2VjdG9yKSB7XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmVxKCdzZWN0b3InLCBmaWx0ZXJzLnNlY3Rvcik7XHJcbiAgfVxyXG4gIGlmIChmaWx0ZXJzPy5mcm9tRGF0ZSkge1xyXG4gICAgcXVlcnkgPSBxdWVyeS5ndGUoJ2Zyb21fZGF0ZScsIGZpbHRlcnMuZnJvbURhdGUpO1xyXG4gIH1cclxuICBpZiAoZmlsdGVycz8udG9EYXRlKSB7XHJcbiAgICBxdWVyeSA9IHF1ZXJ5Lmx0ZSgnZnJvbV9kYXRlJywgZmlsdGVycy50b0RhdGUpO1xyXG4gIH1cclxuICBpZiAoZmlsdGVycz8uc3RhdHVzKSB7XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmVxKCdzdGF0dXMnLCBmaWx0ZXJzLnN0YXR1cyk7XHJcbiAgfVxyXG4gIGlmIChmaWx0ZXJzPy5saW1pdCkge1xyXG4gICAgcXVlcnkgPSBxdWVyeS5saW1pdChmaWx0ZXJzLmxpbWl0KTtcclxuICB9XHJcbiAgaWYgKGZpbHRlcnM/Lm9mZnNldCkge1xyXG4gICAgcXVlcnkgPSBxdWVyeS5yYW5nZShmaWx0ZXJzLm9mZnNldCwgZmlsdGVycy5vZmZzZXQgKyAoZmlsdGVycy5saW1pdCB8fCA1MCkgLSAxKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IsIGNvdW50IH0gPSBhd2FpdCBxdWVyeTtcclxuXHJcbiAgaWYgKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB3YXRjaGxpc3QgYW5hbHlzaXM6JywgZXJyb3IpO1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfVxyXG5cclxuICByZXR1cm4geyBkYXRhLCBjb3VudCB9O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGxhdGVzdCBzdG9jayBxdWVyeSBmb3IgYSBzcGVjaWZpYyBlbWl0ZW5cclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RTdG9ja1F1ZXJ5KGVtaXRlbjogc3RyaW5nKSB7XHJcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgIC5mcm9tKCdzdG9ja19xdWVyaWVzJylcclxuICAgIC5zZWxlY3QoJyonKVxyXG4gICAgLmVxKCdlbWl0ZW4nLCBlbWl0ZW4pXHJcbiAgICAuZXEoJ3N0YXR1cycsICdzdWNjZXNzJylcclxuICAgIC5vcmRlcignZnJvbV9kYXRlJywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAubGltaXQoMSlcclxuICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgaWYgKGVycm9yKSByZXR1cm4gbnVsbDtcclxuICByZXR1cm4gZGF0YTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSB0aGUgbW9zdCByZWNlbnQgcHJldmlvdXMgZGF5J3MgcmVhbCBwcmljZSBmb3IgYW4gZW1pdGVuXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlUHJldmlvdXNEYXlSZWFsUHJpY2UoZW1pdGVuOiBzdHJpbmcsIGN1cnJlbnREYXRlOiBzdHJpbmcsIHByaWNlOiBudW1iZXIpIHtcclxuICAvLyAxLiBGaW5kIHRoZSBsYXRlc3Qgc3VjY2Vzc2Z1bCByZWNvcmQgYmVmb3JlIGN1cnJlbnREYXRlXHJcbiAgY29uc3QgeyBkYXRhOiByZWNvcmQsIGVycm9yOiBmaW5kRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbSgnc3RvY2tfcXVlcmllcycpXHJcbiAgICAuc2VsZWN0KCdpZCwgZnJvbV9kYXRlJylcclxuICAgIC5lcSgnZW1pdGVuJywgZW1pdGVuKVxyXG4gICAgLmVxKCdzdGF0dXMnLCAnc3VjY2VzcycpXHJcbiAgICAubHQoJ2Zyb21fZGF0ZScsIGN1cnJlbnREYXRlKVxyXG4gICAgLm9yZGVyKCdmcm9tX2RhdGUnLCB7IGFzY2VuZGluZzogZmFsc2UgfSlcclxuICAgIC5saW1pdCgxKVxyXG4gICAgLnNpbmdsZSgpO1xyXG5cclxuICBpZiAoZmluZEVycm9yIHx8ICFyZWNvcmQpIHtcclxuICAgIGlmIChmaW5kRXJyb3IgJiYgZmluZEVycm9yLmNvZGUgIT09ICdQR1JTVDExNicpIHsgLy8gUEdSU1QxMTYgaXMgXCJubyByb3dzIHJldHVybmVkXCJcclxuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZmluZGluZyBwcmV2aW91cyByZWNvcmQgZm9yICR7ZW1pdGVufSBiZWZvcmUgJHtjdXJyZW50RGF0ZX06YCwgZmluZEVycm9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLy8gMi4gVXBkYXRlIHRoYXQgcmVjb3JkIHdpdGggdGhlIG5ldyBwcmljZVxyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3I6IHVwZGF0ZUVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oJ3N0b2NrX3F1ZXJpZXMnKVxyXG4gICAgLnVwZGF0ZSh7IHJlYWxfaGFyZ2E6IHByaWNlIH0pXHJcbiAgICAuZXEoJ2lkJywgcmVjb3JkLmlkKVxyXG4gICAgLnNlbGVjdCgpO1xyXG5cclxuICBpZiAodXBkYXRlRXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHVwZGF0aW5nIHJlYWxfaGFyZ2EgZm9yICR7ZW1pdGVufSBvbiAke3JlY29yZC5mcm9tX2RhdGV9OmAsIHVwZGF0ZUVycm9yKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkYXRhO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgbmV3IGFnZW50IHN0b3J5IHJlY29yZCB3aXRoIHBlbmRpbmcgc3RhdHVzXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQWdlbnRTdG9yeShlbWl0ZW46IHN0cmluZykge1xyXG4gIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbSgnYWdlbnRfc3RvcmllcycpXHJcbiAgICAuaW5zZXJ0KHsgZW1pdGVuLCBzdGF0dXM6ICdwZW5kaW5nJyB9KVxyXG4gICAgLnNlbGVjdCgpXHJcbiAgICAuc2luZ2xlKCk7XHJcblxyXG4gIGlmIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgY3JlYXRpbmcgYWdlbnQgc3Rvcnk6JywgZXJyb3IpO1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGF0YTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBhZ2VudCBzdG9yeSB3aXRoIHJlc3VsdCBvciBlcnJvclxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUFnZW50U3RvcnkoaWQ6IG51bWJlciwgZGF0YToge1xyXG4gIHN0YXR1czogJ3Byb2Nlc3NpbmcnIHwgJ2NvbXBsZXRlZCcgfCAnZXJyb3InO1xyXG4gIG1hdHJpa3Nfc3Rvcnk/OiBvYmplY3RbXTtcclxuICBzd290X2FuYWx5c2lzPzogb2JqZWN0O1xyXG4gIGNoZWNrbGlzdF9rYXRhbGlzPzogb2JqZWN0W107XHJcbiAgc3RyYXRlZ2lfdHJhZGluZz86IG9iamVjdDtcclxuICBrZXNpbXB1bGFuPzogc3RyaW5nO1xyXG4gIGVycm9yX21lc3NhZ2U/OiBzdHJpbmc7XHJcbn0pIHtcclxuICBjb25zdCB7IGRhdGE6IHJlc3VsdCwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXHJcbiAgICAuZnJvbSgnYWdlbnRfc3RvcmllcycpXHJcbiAgICAudXBkYXRlKGRhdGEpXHJcbiAgICAuZXEoJ2lkJywgaWQpXHJcbiAgICAuc2VsZWN0KClcclxuICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgaWYgKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciB1cGRhdGluZyBhZ2VudCBzdG9yeTonLCBlcnJvcik7XHJcbiAgICB0aHJvdyBlcnJvcjtcclxuICB9XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgbGF0ZXN0IGFnZW50IHN0b3J5IGZvciBhbiBlbWl0ZW5cclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBZ2VudFN0b3J5QnlFbWl0ZW4oZW1pdGVuOiBzdHJpbmcpIHtcclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oJ2FnZW50X3N0b3JpZXMnKVxyXG4gICAgLnNlbGVjdCgnKicpXHJcbiAgICAuZXEoJ2VtaXRlbicsIGVtaXRlbi50b1VwcGVyQ2FzZSgpKVxyXG4gICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAubGltaXQoMSlcclxuICAgIC5zaW5nbGUoKTtcclxuXHJcbiAgaWYgKGVycm9yICYmIGVycm9yLmNvZGUgIT09ICdQR1JTVDExNicpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGFnZW50IHN0b3J5OicsIGVycm9yKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkYXRhIHx8IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgYWxsIGFnZW50IHN0b3JpZXMgZm9yIGFuIGVtaXRlblxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFnZW50U3Rvcmllc0J5RW1pdGVuKGVtaXRlbjogc3RyaW5nLCBsaW1pdDogbnVtYmVyID0gMjApIHtcclxuICBjb25zdCB7IGRhdGEsIGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oJ2FnZW50X3N0b3JpZXMnKVxyXG4gICAgLnNlbGVjdCgnKicpXHJcbiAgICAuZXEoJ2VtaXRlbicsIGVtaXRlbi50b1VwcGVyQ2FzZSgpKVxyXG4gICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAubGltaXQobGltaXQpO1xyXG5cclxuICBpZiAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGFnZW50IHN0b3JpZXM6JywgZXJyb3IpO1xyXG4gICAgdGhyb3cgZXJyb3I7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGF0YSB8fCBbXTtcclxufVxyXG5cclxuIiwgImltcG9ydCB0eXBlIHsgTWFya2V0RGV0ZWN0b3JSZXNwb25zZSwgT3JkZXJib29rUmVzcG9uc2UsIEJyb2tlckRhdGEsIFdhdGNobGlzdFJlc3BvbnNlLCBCcm9rZXJTdW1tYXJ5RGF0YSwgRW1pdGVuSW5mb1Jlc3BvbnNlLCBLZXlTdGF0c1Jlc3BvbnNlLCBLZXlTdGF0c0RhdGEsIEtleVN0YXRzSXRlbSB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRTZXNzaW9uVmFsdWUgfSBmcm9tICcuL3N1cGFiYXNlJztcclxuXHJcbmNvbnN0IFNUT0NLQklUX0JBU0VfVVJMID0gJ2h0dHBzOi8vZXhvZHVzLnN0b2NrYml0LmNvbSc7XHJcbmNvbnN0IFNUT0NLQklUX0FVVEhfVVJMID0gJ2h0dHBzOi8vc3RvY2tiaXQuY29tJztcclxuXHJcbi8vIENhY2hlIHRva2VuIHRvIHJlZHVjZSBkYXRhYmFzZSBjYWxsc1xyXG5sZXQgY2FjaGVkVG9rZW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG5sZXQgdG9rZW5MYXN0RmV0Y2hlZDogbnVtYmVyID0gMDtcclxuY29uc3QgVE9LRU5fQ0FDSEVfRFVSQVRJT04gPSA2MDAwMDsgLy8gMSBtaW51dGVcclxuXHJcbi8vIENhY2hlIHNlY3RvciBkYXRhIHRvIHJlZHVjZSBBUEkgY2FsbHNcclxuY29uc3Qgc2VjdG9yQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgeyBzZWN0b3I6IHN0cmluZzsgdGltZXN0YW1wOiBudW1iZXIgfT4oKTtcclxuY29uc3QgU0VDVE9SX0NBQ0hFX0RVUkFUSU9OID0gMzYwMDAwMDsgLy8gMSBob3VyXHJcblxyXG4vLyBDYWNoZSBmb3Igc2VjdG9ycyBsaXN0XHJcbmxldCBzZWN0b3JzTGlzdENhY2hlOiB7IHNlY3RvcnM6IHN0cmluZ1tdOyB0aW1lc3RhbXA6IG51bWJlciB9IHwgbnVsbCA9IG51bGw7XHJcbmNvbnN0IFNFQ1RPUlNfTElTVF9DQUNIRV9EVVJBVElPTiA9IDg2NDAwMDAwOyAvLyAyNCBob3Vyc1xyXG5cclxuLyoqXHJcbiAqIEdldCBKV1QgdG9rZW4gZnJvbSBkYXRhYmFzZSBvciBlbnZpcm9ubWVudFxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QXV0aFRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgLy8gUmV0dXJuIGNhY2hlZCB0b2tlbiBpZiBzdGlsbCB2YWxpZFxyXG4gIGlmIChjYWNoZWRUb2tlbiAmJiAobm93IC0gdG9rZW5MYXN0RmV0Y2hlZCkgPCBUT0tFTl9DQUNIRV9EVVJBVElPTikge1xyXG4gICAgcmV0dXJuIGNhY2hlZFRva2VuO1xyXG4gIH1cclxuXHJcbiAgLy8gRmV0Y2ggZnJvbSBkYXRhYmFzZVxyXG4gIGNvbnN0IHRva2VuID0gYXdhaXQgZ2V0U2Vzc2lvblZhbHVlKCdzdG9ja2JpdF90b2tlbicpO1xyXG5cclxuICAvLyBGYWxsYmFjayB0byBlbnYgaWYgZGF0YWJhc2UgdG9rZW4gbm90IGZvdW5kXHJcbiAgaWYgKCF0b2tlbikge1xyXG4gICAgY29uc3QgZW52VG9rZW4gPSBwcm9jZXNzLmVudi5TVE9DS0JJVF9KV1RfVE9LRU47XHJcbiAgICBpZiAoIWVudlRva2VuKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU1RPQ0tCSVRfSldUX1RPS0VOIG5vdCBmb3VuZCBpbiBkYXRhYmFzZSBvciBlbnZpcm9ubWVudCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGVudlRva2VuO1xyXG4gIH1cclxuXHJcbiAgLy8gVXBkYXRlIGNhY2hlXHJcbiAgY2FjaGVkVG9rZW4gPSB0b2tlbjtcclxuICB0b2tlbkxhc3RGZXRjaGVkID0gbm93O1xyXG5cclxuICByZXR1cm4gdG9rZW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb21tb24gaGVhZGVycyBmb3IgU3RvY2tiaXQgQVBJXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBnZXRIZWFkZXJzKCk6IFByb21pc2U8SGVhZGVyc0luaXQ+IHtcclxuICByZXR1cm4ge1xyXG4gICAgJ2FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICdhdXRob3JpemF0aW9uJzogYEJlYXJlciAke2F3YWl0IGdldEF1dGhUb2tlbigpfWAsXHJcbiAgICAnb3JpZ2luJzogJ2h0dHBzOi8vc3RvY2tiaXQuY29tJyxcclxuICAgICdyZWZlcmVyJzogJ2h0dHBzOi8vc3RvY2tiaXQuY29tLycsXHJcbiAgICAndXNlci1hZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTQzLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBNYXJrZXQgRGV0ZWN0b3IgZGF0YSAoYnJva2VyIGluZm9ybWF0aW9uKVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoTWFya2V0RGV0ZWN0b3IoXHJcbiAgZW1pdGVuOiBzdHJpbmcsXHJcbiAgZnJvbURhdGU6IHN0cmluZyxcclxuICB0b0RhdGU6IHN0cmluZ1xyXG4pOiBQcm9taXNlPE1hcmtldERldGVjdG9yUmVzcG9uc2U+IHtcclxuICBjb25zdCB1cmwgPSBuZXcgVVJMKGAke1NUT0NLQklUX0JBU0VfVVJMfS9tYXJrZXRkZXRlY3RvcnMvJHtlbWl0ZW59YCk7XHJcbiAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ2Zyb20nLCBmcm9tRGF0ZSk7XHJcbiAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoJ3RvJywgdG9EYXRlKTtcclxuICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZCgndHJhbnNhY3Rpb25fdHlwZScsICdUUkFOU0FDVElPTl9UWVBFX05FVCcpO1xyXG4gIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdtYXJrZXRfYm9hcmQnLCAnTUFSS0VUX0JPQVJEX1JFR1VMRVInKTtcclxuICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZCgnaW52ZXN0b3JfdHlwZScsICdJTlZFU1RPUl9UWVBFX0FMTCcpO1xyXG4gIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKCdsaW1pdCcsICcyNScpO1xyXG5cclxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybC50b1N0cmluZygpLCB7XHJcbiAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgaGVhZGVyczogYXdhaXQgZ2V0SGVhZGVycygpLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE1hcmtldCBEZXRlY3RvciBBUEkgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2ggT3JkZXJib29rIGRhdGEgKG1hcmtldCBkYXRhKVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoT3JkZXJib29rKGVtaXRlbjogc3RyaW5nKTogUHJvbWlzZTxPcmRlcmJvb2tSZXNwb25zZT4ge1xyXG4gIGNvbnN0IHVybCA9IGAke1NUT0NLQklUX0JBU0VfVVJMfS9jb21wYW55LXByaWNlLWZlZWQvdjIvb3JkZXJib29rL2NvbXBhbmllcy8ke2VtaXRlbn1gO1xyXG5cclxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xyXG4gICAgbWV0aG9kOiAnR0VUJyxcclxuICAgIGhlYWRlcnM6IGF3YWl0IGdldEhlYWRlcnMoKSxcclxuICB9KTtcclxuXHJcbiAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBPcmRlcmJvb2sgQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIEVtaXRlbiBJbmZvIChpbmNsdWRpbmcgc2VjdG9yKVxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoRW1pdGVuSW5mbyhlbWl0ZW46IHN0cmluZyk6IFByb21pc2U8RW1pdGVuSW5mb1Jlc3BvbnNlPiB7XHJcbiAgLy8gQ2hlY2sgY2FjaGUgZmlyc3RcclxuICBjb25zdCBjYWNoZWQgPSBzZWN0b3JDYWNoZS5nZXQoZW1pdGVuLnRvVXBwZXJDYXNlKCkpO1xyXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgXHJcbiAgaWYgKGNhY2hlZCAmJiAobm93IC0gY2FjaGVkLnRpbWVzdGFtcCkgPCBTRUNUT1JfQ0FDSEVfRFVSQVRJT04pIHtcclxuICAgIC8vIFJldHVybiBjYWNoZWQgZGF0YSBpbiB0aGUgZXhwZWN0ZWQgZm9ybWF0XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgc2VjdG9yOiBjYWNoZWQuc2VjdG9yLFxyXG4gICAgICAgIHN1Yl9zZWN0b3I6ICcnLFxyXG4gICAgICAgIHN5bWJvbDogZW1pdGVuLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIHByaWNlOiAnMCcsXHJcbiAgICAgICAgY2hhbmdlOiAnMCcsXHJcbiAgICAgICAgcGVyY2VudGFnZTogMCxcclxuICAgICAgfSxcclxuICAgICAgbWVzc2FnZTogJ1N1Y2Nlc3NmdWxseSByZXRyaWV2ZWQgY29tcGFueSBkYXRhIChjYWNoZWQpJyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBjb25zdCB1cmwgPSBgJHtTVE9DS0JJVF9CQVNFX1VSTH0vZW1pdHRlbi8ke2VtaXRlbn0vaW5mb2A7XHJcblxyXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgaGVhZGVyczogYXdhaXQgZ2V0SGVhZGVycygpLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVtaXRlbiBJbmZvIEFQSSBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRhdGE6IEVtaXRlbkluZm9SZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICBcclxuICAvLyBDYWNoZSB0aGUgc2VjdG9yIGRhdGFcclxuICBpZiAoZGF0YS5kYXRhPy5zZWN0b3IpIHtcclxuICAgIHNlY3RvckNhY2hlLnNldChlbWl0ZW4udG9VcHBlckNhc2UoKSwge1xyXG4gICAgICBzZWN0b3I6IGRhdGEuZGF0YS5zZWN0b3IsXHJcbiAgICAgIHRpbWVzdGFtcDogbm93LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGF0YTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBzZWN0b3JzIGxpc3RcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFNlY3RvcnMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgXHJcbiAgLy8gQ2hlY2sgY2FjaGUgZmlyc3RcclxuICBpZiAoc2VjdG9yc0xpc3RDYWNoZSAmJiAobm93IC0gc2VjdG9yc0xpc3RDYWNoZS50aW1lc3RhbXApIDwgU0VDVE9SU19MSVNUX0NBQ0hFX0RVUkFUSU9OKSB7XHJcbiAgICByZXR1cm4gc2VjdG9yc0xpc3RDYWNoZS5zZWN0b3JzO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdXJsID0gYCR7U1RPQ0tCSVRfQkFTRV9VUkx9L2VtaXR0ZW4vc2VjdG9yc2A7XHJcblxyXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgaGVhZGVyczogYXdhaXQgZ2V0SGVhZGVycygpLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFNlY3RvcnMgQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICBjb25zdCBzZWN0b3JzOiBzdHJpbmdbXSA9IChkYXRhLmRhdGEgfHwgW10pLm1hcCgoaXRlbTogeyBuYW1lOiBzdHJpbmcgfSkgPT4gaXRlbS5uYW1lKS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgXHJcbiAgLy8gQ2FjaGUgdGhlIHNlY3RvcnMgbGlzdFxyXG4gIHNlY3RvcnNMaXN0Q2FjaGUgPSB7XHJcbiAgICBzZWN0b3JzLFxyXG4gICAgdGltZXN0YW1wOiBub3csXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHNlY3RvcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2ggV2F0Y2hsaXN0IGRhdGFcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFdhdGNobGlzdCgpOiBQcm9taXNlPFdhdGNobGlzdFJlc3BvbnNlPiB7XHJcbiAgLy8gU3RlcCAxOiBHZXQgV2F0Y2hsaXN0IElEXHJcbiAgY29uc3QgbWV0YVVybCA9IGAke1NUT0NLQklUX0JBU0VfVVJMfS93YXRjaGxpc3Q/cGFnZT0xJmxpbWl0PTUwMGA7XHJcbiAgY29uc3QgbWV0YVJlc3BvbnNlID0gYXdhaXQgZmV0Y2gobWV0YVVybCwge1xyXG4gICAgbWV0aG9kOiAnR0VUJyxcclxuICAgIGhlYWRlcnM6IGF3YWl0IGdldEhlYWRlcnMoKSxcclxuICB9KTtcclxuXHJcbiAgaWYgKCFtZXRhUmVzcG9uc2Uub2spIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgV2F0Y2hsaXN0IE1ldGEgQVBJIGVycm9yOiAke21ldGFSZXNwb25zZS5zdGF0dXN9ICR7bWV0YVJlc3BvbnNlLnN0YXR1c1RleHR9YCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtZXRhSnNvbiA9IGF3YWl0IG1ldGFSZXNwb25zZS5qc29uKCk7XHJcblxyXG4gIGNvbnN0IHdhdGNobGlzdHMgPSBBcnJheS5pc0FycmF5KG1ldGFKc29uLmRhdGEpID8gbWV0YUpzb24uZGF0YSA6IFttZXRhSnNvbi5kYXRhXTtcclxuICBjb25zdCBkZWZhdWx0V2F0Y2hsaXN0ID0gd2F0Y2hsaXN0cy5maW5kKCh3OiBhbnkpID0+IHcuaXNfZGVmYXVsdCkgfHwgd2F0Y2hsaXN0c1swXTtcclxuICBjb25zdCB3YXRjaGxpc3RJZCA9IGRlZmF1bHRXYXRjaGxpc3Q/LndhdGNobGlzdF9pZDtcclxuXHJcbiAgaWYgKCF3YXRjaGxpc3RJZCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyB3YXRjaGxpc3RfaWQgZm91bmQgaW4gcmVzcG9uc2U6ICR7SlNPTi5zdHJpbmdpZnkobWV0YUpzb24pfWApO1xyXG4gIH1cclxuXHJcbiAgLy8gU3RlcCAyOiBHZXQgV2F0Y2hsaXN0IERldGFpbHNcclxuICBjb25zdCBkZXRhaWxVcmwgPSBgJHtTVE9DS0JJVF9CQVNFX1VSTH0vd2F0Y2hsaXN0LyR7d2F0Y2hsaXN0SWR9P3BhZ2U9MSZsaW1pdD01MDBgO1xyXG4gIGNvbnN0IGRldGFpbFJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZGV0YWlsVXJsLCB7XHJcbiAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgaGVhZGVyczogYXdhaXQgZ2V0SGVhZGVycygpLFxyXG4gIH0pO1xyXG5cclxuICBpZiAoIWRldGFpbFJlc3BvbnNlLm9rKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFdhdGNobGlzdCBEZXRhaWwgQVBJIGVycm9yOiAke2RldGFpbFJlc3BvbnNlLnN0YXR1c30gJHtkZXRhaWxSZXNwb25zZS5zdGF0dXNUZXh0fWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGV0YWlsSnNvbiA9IGF3YWl0IGRldGFpbFJlc3BvbnNlLmpzb24oKTtcclxuXHJcbiAgLy8gTWFwIHN5bWJvbCB0byBjb21wYW55X2NvZGUgZm9yIGNvbXBhdGliaWxpdHlcclxuICBpZiAoZGV0YWlsSnNvbi5kYXRhPy5yZXN1bHQpIHtcclxuICAgIGRldGFpbEpzb24uZGF0YS5yZXN1bHQgPSBkZXRhaWxKc29uLmRhdGEucmVzdWx0Lm1hcCgoaXRlbTogYW55KSA9PiAoe1xyXG4gICAgICAuLi5pdGVtLFxyXG4gICAgICBjb21wYW55X2NvZGU6IGl0ZW0uc3ltYm9sIHx8IGl0ZW0uY29tcGFueV9jb2RlXHJcbiAgICB9KSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGV0YWlsSnNvbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldCB0b3AgYnJva2VyIGJ5IEJWQUwgZnJvbSBNYXJrZXQgRGV0ZWN0b3IgcmVzcG9uc2VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3BCcm9rZXIobWFya2V0RGV0ZWN0b3JEYXRhOiBNYXJrZXREZXRlY3RvclJlc3BvbnNlKTogQnJva2VyRGF0YSB8IG51bGwge1xyXG4gIC8vIERlYnVnIGxvZyB0byBzZWUgYWN0dWFsIEFQSSByZXNwb25zZSBzdHJ1Y3R1cmVcclxuICAvLyBjb25zb2xlLmxvZygnTWFya2V0IERldGVjdG9yIEFQSSBSZXNwb25zZTonLCBKU09OLnN0cmluZ2lmeShtYXJrZXREZXRlY3RvckRhdGEsIG51bGwsIDIpKTtcclxuXHJcbiAgLy8gVGhlIGFjdHVhbCBkYXRhIGlzIHdyYXBwZWQgaW4gJ2RhdGEnIHByb3BlcnR5XHJcbiAgY29uc3QgYnJva2VycyA9IG1hcmtldERldGVjdG9yRGF0YT8uZGF0YT8uYnJva2VyX3N1bW1hcnk/LmJyb2tlcnNfYnV5O1xyXG5cclxuICBpZiAoIWJyb2tlcnMgfHwgIUFycmF5LmlzQXJyYXkoYnJva2VycykgfHwgYnJva2Vycy5sZW5ndGggPT09IDApIHtcclxuICAgIC8vIFJldHVybiBudWxsIGluc3RlYWQgb2YgdGhyb3dpbmcgZXJyb3IgdG8gYWxsb3cgY2FsbGVyIHRvIGhhbmRsZSBncmFjZWZ1bGx5XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8vIFNvcnQgYnkgYnZhbCBkZXNjZW5kaW5nIGFuZCBnZXQgdGhlIGZpcnN0IG9uZVxyXG4gIC8vIE5vdGU6IGJ2YWwgaXMgYSBzdHJpbmcgaW4gdGhlIEFQSSByZXNwb25zZSwgc28gd2UgY29udmVydCB0byBOdW1iZXJcclxuICBjb25zdCB0b3BCcm9rZXIgPSBbLi4uYnJva2Vyc10uc29ydCgoYSwgYikgPT4gTnVtYmVyKGIuYnZhbCkgLSBOdW1iZXIoYS5idmFsKSlbMF07XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBiYW5kYXI6IHRvcEJyb2tlci5uZXRic19icm9rZXJfY29kZSxcclxuICAgIGJhcmFuZ0JhbmRhcjogTWF0aC5yb3VuZChOdW1iZXIodG9wQnJva2VyLmJsb3QpKSxcclxuICAgIHJhdGFSYXRhQmFuZGFyOiBNYXRoLnJvdW5kKE51bWJlcih0b3BCcm9rZXIubmV0YnNfYnV5X2F2Z19wcmljZSkpLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgdG8gcGFyc2UgbG90IHN0cmluZyAoZS5nLiwgXCIyNSwzMjIsMDAwXCIgLT4gMjUzMjIwMDApXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VMb3QobG90U3RyOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIGlmICghbG90U3RyKSByZXR1cm4gMDtcclxuICByZXR1cm4gTnVtYmVyKGxvdFN0ci5yZXBsYWNlKC8sL2csICcnKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgYnJva2VyIHN1bW1hcnkgZGF0YSBmcm9tIE1hcmtldCBEZXRlY3RvciByZXNwb25zZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb2tlclN1bW1hcnkobWFya2V0RGV0ZWN0b3JEYXRhOiBNYXJrZXREZXRlY3RvclJlc3BvbnNlKTogQnJva2VyU3VtbWFyeURhdGEge1xyXG4gIGNvbnN0IGRldGVjdG9yID0gbWFya2V0RGV0ZWN0b3JEYXRhPy5kYXRhPy5iYW5kYXJfZGV0ZWN0b3I7XHJcbiAgY29uc3QgYnJva2VyU3VtbWFyeSA9IG1hcmtldERldGVjdG9yRGF0YT8uZGF0YT8uYnJva2VyX3N1bW1hcnk7XHJcblxyXG4gIC8vIFByb3ZpZGUgc2FmZSBkZWZhdWx0cyBpZiBkYXRhIGlzIG1pc3NpbmdcclxuICByZXR1cm4ge1xyXG4gICAgZGV0ZWN0b3I6IHtcclxuICAgICAgdG9wMTogZGV0ZWN0b3I/LnRvcDEgfHwgeyB2b2w6IDAsIHBlcmNlbnQ6IDAsIGFtb3VudDogMCwgYWNjZGlzdDogJy0nIH0sXHJcbiAgICAgIHRvcDM6IGRldGVjdG9yPy50b3AzIHx8IHsgdm9sOiAwLCBwZXJjZW50OiAwLCBhbW91bnQ6IDAsIGFjY2Rpc3Q6ICctJyB9LFxyXG4gICAgICB0b3A1OiBkZXRlY3Rvcj8udG9wNSB8fCB7IHZvbDogMCwgcGVyY2VudDogMCwgYW1vdW50OiAwLCBhY2NkaXN0OiAnLScgfSxcclxuICAgICAgYXZnOiBkZXRlY3Rvcj8uYXZnIHx8IHsgdm9sOiAwLCBwZXJjZW50OiAwLCBhbW91bnQ6IDAsIGFjY2Rpc3Q6ICctJyB9LFxyXG4gICAgICB0b3RhbF9idXllcjogZGV0ZWN0b3I/LnRvdGFsX2J1eWVyIHx8IDAsXHJcbiAgICAgIHRvdGFsX3NlbGxlcjogZGV0ZWN0b3I/LnRvdGFsX3NlbGxlciB8fCAwLFxyXG4gICAgICBudW1iZXJfYnJva2VyX2J1eXNlbGw6IGRldGVjdG9yPy5udW1iZXJfYnJva2VyX2J1eXNlbGwgfHwgMCxcclxuICAgICAgYnJva2VyX2FjY2Rpc3Q6IGRldGVjdG9yPy5icm9rZXJfYWNjZGlzdCB8fCAnLScsXHJcbiAgICAgIHZvbHVtZTogZGV0ZWN0b3I/LnZvbHVtZSB8fCAwLFxyXG4gICAgICB2YWx1ZTogZGV0ZWN0b3I/LnZhbHVlIHx8IDAsXHJcbiAgICAgIGF2ZXJhZ2U6IGRldGVjdG9yPy5hdmVyYWdlIHx8IDAsXHJcbiAgICB9LFxyXG4gICAgdG9wQnV5ZXJzOiBicm9rZXJTdW1tYXJ5Py5icm9rZXJzX2J1eT8uc2xpY2UoMCwgNCkgfHwgW10sXHJcbiAgICB0b3BTZWxsZXJzOiBicm9rZXJTdW1tYXJ5Py5icm9rZXJzX3NlbGw/LnNsaWNlKDAsIDQpIHx8IFtdLFxyXG4gIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQYXJzZSBLZXlTdGF0cyBBUEkgcmVzcG9uc2UgaW50byBzdHJ1Y3R1cmVkIGRhdGFcclxuICovXHJcbmZ1bmN0aW9uIHBhcnNlS2V5U3RhdHNSZXNwb25zZShqc29uOiBLZXlTdGF0c1Jlc3BvbnNlKTogS2V5U3RhdHNEYXRhIHtcclxuICBjb25zdCBjYXRlZ29yaWVzID0ganNvbi5kYXRhPy5jbG9zdXJlX2Zpbl9pdGVtc19yZXN1bHRzIHx8IFtdO1xyXG4gIFxyXG4gIGNvbnN0IGZpbmRDYXRlZ29yeSA9IChuYW1lOiBzdHJpbmcpOiBLZXlTdGF0c0l0ZW1bXSA9PiB7XHJcbiAgICBjb25zdCBjYXRlZ29yeSA9IGNhdGVnb3JpZXMuZmluZChjID0+IGMua2V5c3RhdHNfbmFtZSA9PT0gbmFtZSk7XHJcbiAgICBpZiAoIWNhdGVnb3J5KSByZXR1cm4gW107XHJcbiAgICByZXR1cm4gY2F0ZWdvcnkuZmluX25hbWVfcmVzdWx0cy5tYXAociA9PiByLmZpdGVtKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgY3VycmVudFZhbHVhdGlvbjogZmluZENhdGVnb3J5KCdDdXJyZW50IFZhbHVhdGlvbicpLFxyXG4gICAgaW5jb21lU3RhdGVtZW50OiBmaW5kQ2F0ZWdvcnkoJ0luY29tZSBTdGF0ZW1lbnQnKSxcclxuICAgIGJhbGFuY2VTaGVldDogZmluZENhdGVnb3J5KCdCYWxhbmNlIFNoZWV0JyksXHJcbiAgICBwcm9maXRhYmlsaXR5OiBmaW5kQ2F0ZWdvcnkoJ1Byb2ZpdGFiaWxpdHknKSxcclxuICAgIGdyb3d0aDogZmluZENhdGVnb3J5KCdHcm93dGgnKSxcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogRmV0Y2ggS2V5U3RhdHMgZGF0YSBmb3IgYSBzdG9ja1xyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoS2V5U3RhdHMoZW1pdGVuOiBzdHJpbmcpOiBQcm9taXNlPEtleVN0YXRzRGF0YT4ge1xyXG4gIGNvbnN0IHVybCA9IGAke1NUT0NLQklUX0JBU0VfVVJMfS9rZXlzdGF0cy9yYXRpby92MS8ke2VtaXRlbn0/eWVhcl9saW1pdD0xMGA7XHJcbiAgXHJcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcclxuICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICBoZWFkZXJzOiBhd2FpdCBnZXRIZWFkZXJzKCksXHJcbiAgfSk7XHJcblxyXG4gIGlmICghcmVzcG9uc2Uub2spIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgS2V5U3RhdHMgQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xyXG4gIH1cclxuXHJcbiAgY29uc3QganNvbjogS2V5U3RhdHNSZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICByZXR1cm4gcGFyc2VLZXlTdGF0c1Jlc3BvbnNlKGpzb24pO1xyXG59XHJcblxyXG4iLCAiLyoqXHJcbiAqIENhbGN1bGF0ZSBGcmFrc2kgYmFzZWQgb24gc3RvY2sgcHJpY2VcclxuICogUnVsZXM6XHJcbiAqIC0gPCAyMDA6IEZyYWtzaSAxXHJcbiAqIC0gMjAwLTQ5OTogRnJha3NpIDJcclxuICogLSA1MDAtMTk5OTogRnJha3NpIDVcclxuICogLSAyMDAwLTQ5OTk6IEZyYWtzaSAxMFxyXG4gKiAtID49IDUwMDA6IEZyYWtzaSAyNVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZyYWtzaShoYXJnYTogbnVtYmVyKTogbnVtYmVyIHtcclxuICBpZiAoaGFyZ2EgPCAyMDApIHJldHVybiAxO1xyXG4gIGlmIChoYXJnYSA+PSAyMDAgJiYgaGFyZ2EgPCA1MDApIHJldHVybiAyO1xyXG4gIGlmIChoYXJnYSA+PSA1MDAgJiYgaGFyZ2EgPCAyMDAwKSByZXR1cm4gNTtcclxuICBpZiAoaGFyZ2EgPj0gMjAwMCAmJiBoYXJnYSA8IDUwMDApIHJldHVybiAxMDtcclxuICByZXR1cm4gMjU7IC8vIGhhcmdhID49IDUwMDBcclxufVxyXG5cclxuLyoqXHJcbiAqIENhbGN1bGF0ZSB0YXJnZXQgcHJpY2VzIGJhc2VkIG9uIGJyb2tlciBhbmQgbWFya2V0IGRhdGFcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVUYXJnZXRzKFxyXG4gIHJhdGFSYXRhQmFuZGFyOiBudW1iZXIsXHJcbiAgYmFyYW5nQmFuZGFyOiBudW1iZXIsXHJcbiAgYXJhOiBudW1iZXIsXHJcbiAgYXJiOiBudW1iZXIsXHJcbiAgdG90YWxCaWQ6IG51bWJlcixcclxuICB0b3RhbE9mZmVyOiBudW1iZXIsXHJcbiAgaGFyZ2E6IG51bWJlclxyXG4pIHtcclxuICAvLyBDYWxjdWxhdGUgRnJha3NpXHJcbiAgY29uc3QgZnJha3NpID0gZ2V0RnJha3NpKGhhcmdhKTtcclxuXHJcbiAgLy8gVG90YWwgUGFwYW4gPSAoQVJBIC0gQVJCKSAvIEZyYWtzaVxyXG4gIGNvbnN0IHRvdGFsUGFwYW4gPSAoYXJhIC0gYXJiKSAvIGZyYWtzaTtcclxuXHJcbiAgLy8gUmF0YSByYXRhIEJpZCBPZmVyID0gKFRvdGFsIEJpZCArIFRvdGFsIE9mZmVyKSAvIFRvdGFsIFBhcGFuXHJcbiAgY29uc3QgcmF0YVJhdGFCaWRPZmVyID0gKHRvdGFsQmlkICsgdG90YWxPZmZlcikgLyB0b3RhbFBhcGFuO1xyXG5cclxuICAvLyBhID0gUmF0YSByYXRhIGJhbmRhciBcdTAwRDcgNSVcclxuICBjb25zdCBhID0gcmF0YVJhdGFCYW5kYXIgKiAwLjA1O1xyXG5cclxuICAvLyBwID0gQmFyYW5nIEJhbmRhciAvIFJhdGEgcmF0YSBCaWQgT2ZlclxyXG4gIGNvbnN0IHAgPSBiYXJhbmdCYW5kYXIgLyByYXRhUmF0YUJpZE9mZXI7XHJcblxyXG4gIC8vIFRhcmdldCBSZWFsaXN0aXMgPSBSYXRhIHJhdGEgYmFuZGFyICsgYSArIChwLzIgXHUwMEQ3IEZyYWtzaSlcclxuICBjb25zdCB0YXJnZXRSZWFsaXN0aXMxID0gcmF0YVJhdGFCYW5kYXIgKyBhICsgKChwIC8gMikgKiBmcmFrc2kpO1xyXG5cclxuICAvLyBUYXJnZXQgTWF4ID0gUmF0YSByYXRhIGJhbmRhciArIGEgKyAocCBcdTAwRDcgRnJha3NpKVxyXG4gIGNvbnN0IHRhcmdldE1heCA9IHJhdGFSYXRhQmFuZGFyICsgYSArIChwICogZnJha3NpKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGZyYWtzaSxcclxuICAgIHRvdGFsUGFwYW46IE1hdGgucm91bmQodG90YWxQYXBhbiksXHJcbiAgICByYXRhUmF0YUJpZE9mZXI6IE1hdGgucm91bmQocmF0YVJhdGFCaWRPZmVyKSxcclxuICAgIGE6IE1hdGgucm91bmQoYSksXHJcbiAgICBwOiBNYXRoLnJvdW5kKHApLFxyXG4gICAgdGFyZ2V0UmVhbGlzdGlzMTogTWF0aC5yb3VuZCh0YXJnZXRSZWFsaXN0aXMxKSxcclxuICAgIHRhcmdldE1heDogTWF0aC5yb3VuZCh0YXJnZXRNYXgpLFxyXG4gIH07XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNBQSx5QkFBNkI7QUFFN0IsSUFBTSxjQUFjLFFBQVEsSUFBSTtBQUNoQyxJQUFNLGtCQUFrQixRQUFRLElBQUk7QUFFN0IsSUFBTSxlQUFXLGlDQUFhLGFBQWEsZUFBZTtBQTBDakUsZUFBc0IsZ0JBQWdCLEtBQXFDO0FBQ3pFLFFBQU0sRUFBRSxNQUFNLE1BQU0sSUFBSSxNQUFNLFNBQzNCLEtBQUssU0FBUyxFQUNkLE9BQU8sT0FBTyxFQUNkLEdBQUcsT0FBTyxHQUFHLEVBQ2IsT0FBTztBQUVWLE1BQUksU0FBUyxDQUFDLEtB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
