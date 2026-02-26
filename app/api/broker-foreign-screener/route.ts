import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerActivityDetail, fetchEmitenInfo, fetchTradersahamBrokerFlow } from '@/lib/stockbit';
import { getDateNDaysAgo, getLatestTradingDate } from '@/lib/utils';
import { BROKERS } from '@/lib/brokers';
import type { BrokerForeignScreenerResultItem, BrokerBuyItem, BrokerSellItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nDays = parseInt(searchParams.get('nDays') || '1');
    const minNetForeignValue = parseFloat(searchParams.get('minNetForeignValue') || '0');
    const minSmartMoneyNetValue = parseFloat(searchParams.get('minSmartMoneyNetValue') || '0');
    const smartMoneyBrokerCodesParam = searchParams.get('smartMoneyBrokerCodes');
    const minPositiveDays = parseInt(searchParams.get('minPositiveDays') || '1'); // NEW: Consistency filter
    const consistencyLookbackDays = parseInt(searchParams.get('consistencyLookbackDays') || '1'); // NEW: Consistency lookback

    if (!smartMoneyBrokerCodesParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: smartMoneyBrokerCodes' },
        { status: 400 }
      );
    }

    const smartMoneyBrokerCodes = smartMoneyBrokerCodesParam.split(',').map(code => code.trim().toUpperCase());

    const toDate = getLatestTradingDate();
    const fromDate = getDateNDaysAgo(nDays - 1, toDate); // nDays includes the 'toDate'

    const screenerResults: BrokerForeignScreenerResultItem[] = [];
    
    // Map to aggregate activity per stock across all selected smart money brokers
    const aggregatedStockActivities = new Map<string, {
      smartMoneyNetValue: number;
      smartMoneyBuyValue: number;
      smartMoneyBuyLot: number;
      smartMoneySellValue: number;
      smartMoneySellLot: number;
      foreignNetValue: number; // Net value from foreign smart money brokers
      involvedBrokers: Set<string>;
      weightedBuyPriceSum: number;
      weightedBuyLotSum: number;
    }>();

    // 1. Fetch and aggregate broker activity for each selected Smart Money broker
    for (const brokerCode of smartMoneyBrokerCodes) {
      const brokerInfo = BROKERS[brokerCode] || { type: 'Unknown' };
      const brokerActivity = await fetchBrokerActivityDetail(brokerCode, fromDate, toDate);

      if (brokerActivity.data && brokerActivity.data.broker_summary) {
        // Process buys
        brokerActivity.data.broker_summary.brokers_buy.forEach((item: BrokerBuyItem) => {
          const stockCode = item.netbs_stock_code;
          const bval = parseFloat(item.bval);
          const blot = parseFloat(item.blot);
          const buyAvgPrice = parseFloat(item.netbs_buy_avg_price);

          if (!aggregatedStockActivities.has(stockCode)) {
            aggregatedStockActivities.set(stockCode, {
              smartMoneyNetValue: 0,
              smartMoneyBuyValue: 0,
              smartMoneyBuyLot: 0,
              smartMoneySellValue: 0,
              smartMoneySellLot: 0,
              foreignNetValue: 0,
              involvedBrokers: new Set(),
              weightedBuyPriceSum: 0,
              weightedBuyLotSum: 0,
            });
          }
          const stockAgg = aggregatedStockActivities.get(stockCode)!;
          stockAgg.smartMoneyNetValue += bval;
          stockAgg.smartMoneyBuyValue += bval;
          stockAgg.smartMoneyBuyLot += blot;
          stockAgg.involvedBrokers.add(brokerCode);
          stockAgg.weightedBuyPriceSum += buyAvgPrice * blot;
          stockAgg.weightedBuyLotSum += blot;

          if (brokerInfo.type === 'Foreign') {
            stockAgg.foreignNetValue += bval;
          }
        });

        // Process sells
        brokerActivity.data.broker_summary.brokers_sell.forEach((item: BrokerSellItem) => {
          const stockCode = item.netbs_stock_code;
          const sval = Math.abs(parseFloat(item.sval)); // Sell value is usually negative in API, use absolute
          const slot = Math.abs(parseFloat(item.slot));
          const sellAvgPrice = parseFloat(item.netbs_sell_avg_price);

          if (!aggregatedStockActivities.has(stockCode)) {
            aggregatedStockActivities.set(stockCode, {
              smartMoneyNetValue: 0,
              smartMoneyBuyValue: 0,
              smartMoneyBuyLot: 0,
              smartMoneySellValue: 0,
              smartMoneySellLot: 0,
              foreignNetValue: 0,
              involvedBrokers: new Set(),
              weightedBuyPriceSum: 0,
              weightedBuyLotSum: 0,
            });
          }
          const stockAgg = aggregatedStockActivities.get(stockCode)!;
          stockAgg.smartMoneyNetValue -= sval;
          stockAgg.smartMoneySellValue += sval;
          stockAgg.smartMoneySellLot += slot;
          stockAgg.involvedBrokers.add(brokerCode); // Still involved even if selling

          if (brokerInfo.type === 'Foreign') {
            stockAgg.foreignNetValue -= sval;
          }
        });
      }
    }

    // 2. Filter and enrich results
    for (const [stockCode, aggregated] of aggregatedStockActivities.entries()) {
      // Apply filters
      if (aggregated.smartMoneyNetValue < minSmartMoneyNetValue) {
        continue;
      }
      if (aggregated.foreignNetValue < minNetForeignValue) {
        continue;
      }

      // --- NEW: Consistency Check ---
      let consistencyPositiveDays = 0;
      let consistencyTotalDays = 0;

      try {
        const consistencyFromDate = getDateNDaysAgo(consistencyLookbackDays - 1, toDate);
        const brokerFlowData = await fetchTradersahamBrokerFlow(stockCode, consistencyLookbackDays, 'accum'); // Always check for accumulation consistency
        
        const relevantActivities = brokerFlowData.activities.filter(bfActivity => 
          smartMoneyBrokerCodes.includes(bfActivity.broker_code)
        );

        // Aggregate daily net values across selected brokers for this stock
        const dailyAggregatedNetValues = new Map<string, number>(); // date -> total net value for selected brokers
        for (const bfActivity of relevantActivities) {
          for (const dailyItem of bfActivity.daily_data) {
            dailyAggregatedNetValues.set(dailyItem.d, (dailyAggregatedNetValues.get(dailyItem.d) || 0) + dailyItem.n);
          }
        }

        // Filter daily data to only include dates within the consistency lookback range
        const allDatesInLookback = Array.from({ length: consistencyLookbackDays }, (_, i) => {
          const d = new Date(toDate);
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).filter(d => d >= consistencyFromDate && d <= toDate); // Ensure dates are within range

        consistencyTotalDays = allDatesInLookback.length;
        
        allDatesInLookback.forEach(date => {
          const netValue = dailyAggregatedNetValues.get(date) || 0;
          if (netValue > 0) { // Check for positive net value (accumulation)
            consistencyPositiveDays++;
          }
        });

      } catch (consistencyError) {
        console.warn(`Failed to fetch broker flow for consistency check for ${stockCode}:`, consistencyError);
        // If consistency data can't be fetched, it just means consistency_positive_days will be 0.
      }

      // Apply consistency filter
      if (consistencyPositiveDays < minPositiveDays) {
        continue;
      }

      // Fetch current price and change for display
      let lastPrice: number | undefined;
      let changePercentage: number | undefined;
      let stockName: string | undefined;
      try {
        const emitenInfo = await fetchEmitenInfo(stockCode);
        stockName = emitenInfo.data?.name || stockCode;
        lastPrice = parseFloat(emitenInfo.data?.price || '0');
        changePercentage = emitenInfo.data?.percentage;
      } catch (infoError) {
        console.warn(`Failed to fetch emiten info for ${stockCode}:`, infoError);
      }

      let avgPriceSmartMoney = 0;
      if (aggregated.weightedBuyLotSum > 0) {
        avgPriceSmartMoney = aggregated.weightedBuyPriceSum / aggregated.weightedBuyLotSum;
      }

      screenerResults.push({
        symbol: stockCode,
        stock_name: stockName,
        net_foreign_buy_value: aggregated.foreignNetValue, // Now represents net foreign buy by selected SM brokers
        smart_money_net_value: aggregated.smartMoneyNetValue,
        smart_money_brokers_involved: Array.from(aggregated.involvedBrokers),
        avg_price_smart_money: avgPriceSmartMoney,
        last_price: lastPrice,
        change_percentage: changePercentage,
        consistency_positive_days: consistencyPositiveDays, // NEW
        consistency_total_days: consistencyTotalDays,       // NEW
      });
    }

    // Sort results by smart_money_net_value descending
    screenerResults.sort((a, b) => b.smart_money_net_value - a.smart_money_net_value);

    return NextResponse.json({
      success: true,
      data: screenerResults,
      screen_date: toDate,
      days: nDays,
      message: 'Successfully retrieved broker foreign screener results',
    });
  } catch (error) {
    console.error('Broker Foreign Screener API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker foreign screener data' },
      { status: 500 }
    );
  }
}