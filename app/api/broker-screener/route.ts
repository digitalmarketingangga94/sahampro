import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerActivityDetail, fetchEmitenInfo, fetchTradersahamBrokerFlow, fetchOrderbook } from '@/lib/stockbit'; // Added fetchOrderbook
import { getDateNDaysAgo, getLatestTradingDate } from '@/lib/utils';
import type { BrokerStockActivityPerBroker, BrokerScreenerResultItem, BrokerBuyItem, BrokerSellItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerCodesParam = searchParams.get('brokerCodes');
    const nDays = parseInt(searchParams.get('nDays') || '1');
    const netBuy = searchParams.get('netBuy') === 'true';
    const minPositiveDays = parseInt(searchParams.get('minPositiveDays') || '3');
    const consistencyLookbackDays = parseInt(searchParams.get('consistencyLookbackDays') || '5');
    const minPrice = parseInt(searchParams.get('minPrice') || '100'); // New param: minimum price

    if (!brokerCodesParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: brokerCodes' },
        { status: 400 }
      );
    }

    const brokerCodes = brokerCodesParam.split(',').map(code => code.trim().toUpperCase());

    const toDate = getLatestTradingDate();
    const fromDate = getDateNDaysAgo(nDays - 1, toDate); // nDays includes the 'toDate'

    const allBrokerActivitiesMap = new Map<string, Map<string, BrokerStockActivityPerBroker>>();
    const uniqueStockCodes = new Set<string>();

    // --- Step 1: Fetch aggregated broker activity for each selected broker ---
    for (const brokerCode of brokerCodes) {
      const brokerActivity = await fetchBrokerActivityDetail(brokerCode, fromDate, toDate);
      if (brokerActivity.data && brokerActivity.data.broker_summary) {
        const brokerStockMap = new Map<string, BrokerStockActivityPerBroker>();

        brokerActivity.data.broker_summary.brokers_buy.forEach((item: BrokerBuyItem) => {
          const stockCode = item.netbs_stock_code;
          uniqueStockCodes.add(stockCode);
          const existing = brokerStockMap.get(stockCode);
          if (existing) {
            existing.buy_value += parseFloat(item.bval);
            existing.buy_lot += parseFloat(item.blot);
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
            existing.buy_avg_price = parseFloat(item.netbs_buy_avg_price);
          } else {
            brokerStockMap.set(stockCode, {
              broker_code: brokerCode,
              stock_code: stockCode,
              broker_type: 'Unknown',
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
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
            existing.sell_avg_price = parseFloat(item.netbs_sell_avg_price);
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

    // --- Step 2: Fetch stock names and current prices in parallel ---
    const stockInfoPromises = Array.from(uniqueStockCodes).map(async (code) => {
      try {
        const [emitenInfo, orderbookData] = await Promise.all([
          fetchEmitenInfo(code).catch(() => null),
          fetchOrderbook(code).catch(() => null),
        ]);
        const currentPrice = orderbookData?.data?.close || 0;
        return { code, name: emitenInfo?.data?.name || code, currentPrice };
      } catch (infoError) {
        console.warn(`Failed to fetch info for ${code}:`, infoError);
        return { code, name: code, currentPrice: 0 };
      }
    });
    const stockInfos = await Promise.all(stockInfoPromises);
    const stockNameMap = new Map<string, string>();
    const stockPriceMap = new Map<string, number>();
    stockInfos.forEach(item => {
      stockNameMap.set(item.code, item.name);
      stockPriceMap.set(item.code, item.currentPrice);
    });

    // --- Step 3: Filter stocks based on "AND" logic and prepare results ---
    const screenerResults: BrokerScreenerResultItem[] = [];

    for (const stockCode of uniqueStockCodes) {
      let allBrokersMatchCriteria = true;
      let totalNetLot = 0;
      let totalWeightedPrice = 0;
      let totalRelevantLot = 0;
      let dominantBrokerCode = '';
      let maxNetLot = 0;
      const currentPrice = stockPriceMap.get(stockCode) || 0;

      // Apply minimum price filter first
      if (currentPrice < minPrice) {
        continue; // Skip this stock if it doesn't meet the minimum price
      }

      for (const brokerCode of brokerCodes) {
        const brokerStockMap = allBrokerActivitiesMap.get(brokerCode);
        const activity = brokerStockMap?.get(stockCode);

        if (!activity) {
          allBrokersMatchCriteria = false;
          break;
        }

        const isNetBuyMatch = netBuy && activity.net_lot > 0;
        const isNetSellMatch = !netBuy && activity.net_lot < 0;

        if (!isNetBuyMatch && !isNetSellMatch) {
          allBrokersMatchCriteria = false;
          break;
        }

        totalNetLot += activity.net_lot;
        if (Math.abs(activity.net_lot) > Math.abs(maxNetLot)) {
          maxNetLot = activity.net_lot;
          dominantBrokerCode = activity.broker_code;
        }

        if (netBuy) {
          totalWeightedPrice += activity.buy_avg_price * activity.buy_lot;
          totalRelevantLot += activity.buy_lot;
        } else {
          totalWeightedPrice += activity.sell_avg_price * activity.sell_lot;
          totalRelevantLot += activity.sell_lot;
        }
      }

      if (allBrokersMatchCriteria) {
        const avgPerDay = totalNetLot / nDays;
        const dominantPercent = (Math.abs(maxNetLot) / (totalNetLot !== 0 ? Math.abs(totalNetLot) : 1)) * 100; // Avoid division by zero
        const avgPrice = totalRelevantLot > 0 ? totalWeightedPrice / totalRelevantLot : 0;

        // --- NEW: Consistency Check ---
        let consistencyPositiveDays = 0;
        let consistencyTotalDays = 0;

        try {
          const brokerFlowData = await fetchTradersahamBrokerFlow(stockCode, consistencyLookbackDays);
          const relevantActivities = brokerFlowData.activities.filter(bfActivity => 
            brokerCodes.includes(bfActivity.broker_code)
          );

          // Aggregate daily net values across selected brokers for this stock
          const dailyAggregatedNetValues = new Map<string, number>(); // date -> total net value for selected brokers
          for (const bfActivity of relevantActivities) {
            for (const dailyItem of bfActivity.daily_data) {
              dailyAggregatedNetValues.set(dailyItem.d, (dailyAggregatedNetValues.get(dailyItem.d) || 0) + dailyItem.n);
            }
          }

          consistencyTotalDays = dailyAggregatedNetValues.size;
          dailyAggregatedNetValues.forEach(netValue => {
            // Check for positive net lot if netBuy is true, or negative if netBuy is false
            if ((netBuy && netValue > 0) || (!netBuy && netValue < 0)) {
              consistencyPositiveDays++;
            }
          });

        } catch (consistencyError) {
          console.warn(`Failed to fetch broker flow for consistency check for ${stockCode}:`, consistencyError);
          allBrokersMatchCriteria = false; // Mark as not matching if consistency data can't be fetched
        }

        if (allBrokersMatchCriteria && consistencyPositiveDays >= minPositiveDays) {
          screenerResults.push({
            symbol: stockCode,
            stock_name: stockNameMap.get(stockCode),
            net_direction: netBuy ? 'Net Buy' : 'Net Sell',
            net_lot: totalNetLot,
            avg_per_day: avgPerDay,
            avg_price: avgPrice,
            dominant_broker: dominantBrokerCode,
            dominant_percent: isNaN(dominantPercent) ? 0 : dominantPercent,
            consistency_positive_days: consistencyPositiveDays,
            consistency_total_days: consistencyTotalDays,
          });
        }
      }
    }

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