import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerActivityDetail, fetchEmitenInfo, fetchMarketDetector, fetchTradersahamBrokerFlow } from '@/lib/stockbit';
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

    // --- Step 1: Fetch aggregated broker activity for each selected broker ---
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

    // --- Step 2: Fetch stock names in parallel ---
    const stockNameMap = new Map<string, string>();
    if (uniqueStockCodes.size > 0) {
      const namePromises = Array.from(uniqueStockCodes).map(async (code) => {
        try {
          const emitenInfo = await fetchEmitenInfo(code);
          return { code, name: emitenInfo.data?.name || code };
        } catch (nameError) {
          console.warn(`Failed to fetch name for ${code}:`, nameError);
          return { code, name: code };
        }
      });
      const names = await Promise.all(namePromises);
      names.forEach(item => stockNameMap.set(item.code, item.name));
    }

    const screenerResults: BrokerScreenerResultItem[] = [];

    // --- Step 3: Filter stocks based on "AND" logic and prepare for advanced calculation ---
    for (const stockCode of uniqueStockCodes) {
      let allBrokersMatchCriteria = true;
      const matchingBrokerActivitiesForStock: BrokerStockActivityPerBroker[] = [];

      for (const brokerCode of brokerCodes) {
        const brokerStockMap = allBrokerActivitiesMap.get(brokerCode);
        const activity = brokerStockMap?.get(stockCode);

        if (!activity) {
          // If any selected broker has no activity for this stock, it doesn't match
          allBrokersMatchCriteria = false;
          break;
        }

        // Check net_lot direction based on netBuy filter
        const isNetBuyMatch = netBuy && activity.net_lot > 0;
        const isNetSellMatch = !netBuy && activity.net_lot < 0;

        if (!isNetBuyMatch && !isNetSellMatch) {
          // If activity exists but doesn't match the desired net direction, it doesn't match
          allBrokersMatchCriteria = false;
          break;
        }
        matchingBrokerActivitiesForStock.push(activity);
      }

      if (allBrokersMatchCriteria && matchingBrokerActivitiesForStock.length === brokerCodes.length) {
        let totalNetLot = 0;
        let combinedNetValue = 0; // Sum of net_value from all matching brokers
        let dominantBroker = '';
        let maxNetLot = 0;
        let totalWeightedPrice = 0; // For average price calculation
        let totalRelevantLot = 0;   // For average price calculation

        for (const activity of matchingBrokerActivitiesForStock) {
          totalNetLot += activity.net_lot;
          combinedNetValue += activity.net_value;

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

        // Fetch overall market data for the stock for Dominance Ratio and Volume Control
        const marketDetectorData = await fetchMarketDetector(stockCode, fromDate, toDate);
        const overallMarketVolume = marketDetectorData.data?.bandar_detector?.volume || 0;
        const overallMarketNetValue = marketDetectorData.data?.bandar_detector?.value || 0;
        const dailyMarketData = marketDetectorData.data?.bandar_detector?.daily_data || [];

        // Get close price for the last day in the period and previous day
        const latestClosePrice = dailyMarketData.find(d => d.d === toDate)?.c || 0;
        const previousClosePrice = dailyMarketData.find(d => d.d === getDateNDaysAgo(1, toDate))?.c || 0;
        const latestOpenPrice = dailyMarketData.find(d => d.d === toDate)?.o || 0;


        const brokerPersistenceScores: number[] = [];

        for (const brokerCode of brokerCodes) {
            // Fetch daily broker flow for persistence score
            const brokerFlowResponse = await fetchTradersahamBrokerFlow(stockCode, nDays);
            const brokerFlowActivity = brokerFlowResponse.activities.find(act => act.broker_code === brokerCode);

            if (brokerFlowActivity && brokerFlowActivity.daily_data) {
              let consistentNetDays = 0;
              brokerFlowActivity.daily_data.forEach(daily => {
                if (netBuy && daily.n > 0) consistentNetDays++;
                if (!netBuy && daily.n < 0) consistentNetDays++;
              });
              brokerPersistenceScores.push(consistentNetDays / nDays);
            } else {
              brokerPersistenceScores.push(0); // No daily data for persistence
            }
        }

        // Calculate components for Dominant Broker Score
        const absCombinedNetValue = Math.abs(combinedNetValue);
        const absOverallMarketNetValue = Math.abs(overallMarketNetValue);

        const basicDominanceRatio = absOverallMarketNetValue > 0 ? absCombinedNetValue / absOverallMarketNetValue : 0;
        const volumeControlRatio = overallMarketVolume > 0 ? absCombinedNetValue / overallMarketVolume : 0;

        let directionalStrength = 0;
        if (latestClosePrice > 0 && latestOpenPrice > 0) { // Ensure prices are valid
          if (netBuy && latestClosePrice > latestOpenPrice) directionalStrength = 1;
          else if (!netBuy && latestClosePrice < latestOpenPrice) directionalStrength = 1;
          else directionalStrength = -1; // Broker net buy but price down, or net sell but price up
        }

        const averagePersistenceScore = brokerPersistenceScores.length > 0
          ? brokerPersistenceScores.reduce((sum, score) => sum + score, 0) / brokerPersistenceScores.length
          : 0;

        let dominantBrokerScore =
          (basicDominanceRatio * 0.4) +
          (volumeControlRatio * 0.2) +
          (averagePersistenceScore * 0.3) +
          (directionalStrength * 0.1);
        
        // Cap the score at 1.0 (100%) before multiplying by 100
        dominantBrokerScore = Math.min(dominantBrokerScore, 1.0);


        const avgPerDay = totalNetLot / nDays;
        const dominantPercent = (Math.abs(maxNetLot) / Math.abs(totalNetLot)) * 100;
        const avgPrice = totalRelevantLot > 0 ? totalWeightedPrice / totalRelevantLot : 0;

        screenerResults.push({
          symbol: stockCode,
          stock_name: stockNameMap.get(stockCode),
          net_direction: netBuy ? 'Net Buy' : 'Net Sell',
          net_lot: totalNetLot,
          avg_per_day: avgPerDay,
          avg_price: avgPrice,
          dominant_broker: dominantBroker,
          dominant_percent: isNaN(dominantPercent) ? 0 : dominantPercent,
          dominantBrokerScore: dominantBrokerScore * 100, // Convert to percentage for interpretation
          basicDominanceRatio: basicDominanceRatio * 100,
          volumeControlRatio: volumeControlRatio * 100,
          directionalStrength: directionalStrength,
          persistenceScore: averagePersistenceScore * 100,
        });
      }
    }

    // Sort results by the new Dominant Broker Score descending
    screenerResults.sort((a, b) => (b.dominantBrokerScore || 0) - (a.dominantBrokerScore || 0));

    return NextResponse.json({
      success: true,
      data: screenerResults,
      screen_date: toDate,
      broksum_eod: toDate,
      days: nDays,
      brokers_count: brokerCodes.length,
      must_net_buy: netBuy,
      message: 'Successfully retrieved broker screener results with advanced dominance score',
    });
  } catch (error) {
    console.error('Broker Screener API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker screener data' },
      { status: 500 }
    );
  }
}