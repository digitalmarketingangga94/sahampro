import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerActivityDetail, fetchEmitenInfo } from '@/lib/stockbit';
import { getDateNDaysAgo, getLatestTradingDate } from '@/lib/utils';
import type { BrokerStockActivityPerBroker, BrokerScreenerResultItem, BrokerBuyItem, BrokerSellItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerCodesParam = searchParams.get('brokerCodes');
    const nDays = parseInt(searchParams.get('nDays') || '1');
    const netBuy = searchParams.get('netBuy') === 'true';

    if (!brokerCodesParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: brokerCodes' },
        { status: 400 }
      );
    }

    const brokerCodes = brokerCodesParam.split(',').map(code => code.trim().toUpperCase());

    const toDate = getLatestTradingDate();
    const fromDate = getDateNDaysAgo(nDays - 1, toDate); // nDays includes the 'toDate'

    // Store all activities fetched, keyed by brokerCode then stockCode
    const allBrokerActivitiesMap = new Map<string, Map<string, BrokerStockActivityPerBroker>>();
    const uniqueStockCodes = new Set<string>();

    // Fetch activity for each selected broker
    for (const brokerCode of brokerCodes) {
      const brokerActivity = await fetchBrokerActivityDetail(brokerCode, fromDate, toDate);
      if (brokerActivity.data && brokerActivity.data.broker_summary) {
        const brokerStockMap = new Map<string, BrokerStockActivityPerBroker>();

        // Combine buys and sells for the same stock by the same broker
        brokerActivity.data.broker_summary.brokers_buy.forEach((item: BrokerBuyItem) => {
          const stockCode = item.netbs_stock_code;
          uniqueStockCodes.add(stockCode);
          const existing = brokerStockMap.get(stockCode);
          if (existing) {
            existing.buy_value += parseFloat(item.bval);
            existing.buy_lot += parseFloat(item.blot);
            existing.buy_avg_price = parseFloat(item.netbs_buy_avg_price);
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
          } else {
            brokerStockMap.set(stockCode, {
              broker_code: brokerCode,
              stock_code: stockCode,
              broker_type: 'Unknown', // Will be updated later if needed
              net_value: parseFloat(item.bval),
              net_lot: parseFloat(item.blot),
              buy_value: parseFloat(item.bval),
              buy_lot: parseFloat(item.blot),
              buy_avg_price: parseFloat(item.netbs_buy_avg_price),
              sell_value: 0,
              sell_lot: 0,
              sell_avg_price: 0,
            });
          }
        });

        brokerActivity.data.broker_summary.brokers_sell.forEach((item: BrokerSellItem) => {
          const stockCode = item.netbs_stock_code;
          uniqueStockCodes.add(stockCode);
          const existing = brokerStockMap.get(stockCode);
          if (existing) {
            existing.sell_value += Math.abs(parseFloat(item.sval));
            existing.sell_lot += Math.abs(parseFloat(item.slot));
            existing.sell_avg_price = parseFloat(item.netbs_sell_avg_price);
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
          } else {
            brokerStockMap.set(stockCode, {
              broker_code: brokerCode,
              stock_code: stockCode,
              broker_type: 'Unknown',
              net_value: -Math.abs(parseFloat(item.sval)),
              net_lot: -Math.abs(parseFloat(item.slot)),
              buy_value: 0,
              buy_lot: 0,
              buy_avg_price: 0,
              sell_value: Math.abs(parseFloat(item.sval)),
              sell_lot: Math.abs(parseFloat(item.slot)),
              sell_avg_price: parseFloat(item.netbs_sell_avg_price),
            });
          }
        });
        allBrokerActivitiesMap.set(brokerCode, brokerStockMap);
      }
    }

    // Fetch stock names for all unique stock codes in parallel
    const stockNameMap = new Map<string, string>();
    if (uniqueStockCodes.size > 0) {
      const namePromises = Array.from(uniqueStockCodes).map(async (code) => {
        try {
          const emitenInfo = await fetchEmitenInfo(code);
          return { code, name: emitenInfo.data?.name || code };
        } catch (nameError) {
          console.warn(`Failed to fetch name for ${code}:`, nameError);
          return { code, name: code }; // Fallback to code if name fetch fails
        }
      });
      const names = await Promise.all(namePromises);
      names.forEach(item => stockNameMap.set(item.code, item.name));
    }

    const screenerResults: BrokerScreenerResultItem[] = [];

    // Filter and aggregate results based on "OR" logic
    for (const stockCode of uniqueStockCodes) {
      let hasMatchingActivity = false;
      const matchingBrokerActivitiesForStock: BrokerStockActivityPerBroker[] = [];

      for (const brokerCode of brokerCodes) {
        const brokerStockMap = allBrokerActivitiesMap.get(brokerCode);
        const activity = brokerStockMap?.get(stockCode);

        if (activity) {
          // Check net_lot direction based on netBuy filter
          const isNetBuyMatch = netBuy && activity.net_lot > 0;
          const isNetSellMatch = !netBuy && activity.net_lot < 0;

          if (isNetBuyMatch || isNetSellMatch) {
            hasMatchingActivity = true;
            matchingBrokerActivitiesForStock.push(activity);
          }
        }
      }

      if (hasMatchingActivity) {
        let totalNetLot = 0;
        let dominantBroker = '';
        let maxNetLot = 0;
        let totalWeightedPrice = 0;
        let totalRelevantLot = 0;

        for (const activity of matchingBrokerActivitiesForStock) {
          totalNetLot += activity.net_lot;

          if (Math.abs(activity.net_lot) > Math.abs(maxNetLot)) {
            maxNetLot = activity.net_lot;
            dominantBroker = activity.broker_code;
          }

          if (netBuy) {
            totalWeightedPrice += activity.buy_avg_price * activity.buy_lot;
            totalRelevantLot += activity.buy_lot;
          } else { // Net Sell
            totalWeightedPrice += activity.sell_avg_price * activity.sell_lot;
            totalRelevantLot += activity.sell_lot;
          }
        }

        const avgPerDay = totalNetLot / nDays;
        const dominantPercent = (Math.abs(maxNetLot) / Math.abs(totalNetLot)) * 100;
        const avgPrice = totalRelevantLot > 0 ? totalWeightedPrice / totalRelevantLot : 0;

        screenerResults.push({
          symbol: stockCode,
          stock_name: stockNameMap.get(stockCode),
          net_direction: netBuy ? 'Net Buy' : 'Net Sell', // Updated direction
          net_lot: totalNetLot,
          avg_per_day: avgPerDay,
          dominant_broker: dominantBroker,
          dominant_percent: isNaN(dominantPercent) ? 0 : dominantPercent,
          avg_price: avgPrice,
        });
      }
    }

    // Sort results by net_lot descending
    screenerResults.sort((a, b) => b.net_lot - a.net_lot);

    return NextResponse.json({
      success: true,
      data: screenerResults,
      screen_date: toDate,
      broksum_eod: toDate,
      days: nDays,
      brokers_count: brokerCodes.length,
      must_net_buy: netBuy,
      message: 'Successfully retrieved broker screener results',
    });
  } catch (error) {
    console.error('Broker Screener API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker screener data' },
      { status: 500 }
    );
  }
}