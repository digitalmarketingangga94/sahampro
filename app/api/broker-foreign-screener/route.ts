import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketMovers, fetchBrokerActivityDetail, fetchEmitenInfo } from '@/lib/stockbit';
import { getDateNDaysAgo, getLatestTradingDate } from '@/lib/utils';
import { BROKERS } from '@/lib/brokers';
import type { BrokerForeignScreenerResultItem, BrokerBuyItem, BrokerSellItem, MarketMoverItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nDays = parseInt(searchParams.get('nDays') || '1');
    const minNetForeignValue = parseFloat(searchParams.get('minNetForeignValue') || '0');
    const minSmartMoneyNetValue = parseFloat(searchParams.get('minSmartMoneyNetValue') || '0');
    const smartMoneyBrokerCodesParam = searchParams.get('smartMoneyBrokerCodes');

    if (!smartMoneyBrokerCodesParam) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: smartMoneyBrokerCodes' },
        { status: 400 }
      );
    }

    const smartMoneyBrokerCodes = smartMoneyBrokerCodesParam.split(',').map(code => code.trim().toUpperCase());

    const toDate = getLatestTradingDate();
    const fromDate = getDateNDaysAgo(nDays - 1, toDate); // nDays still used for broker activity detail

    const screenerResults: BrokerForeignScreenerResultItem[] = [];
    const uniqueStockCodes = new Set<string>();

    // 1. Fetch Top Net Foreign Buy Stocks using fetchMarketMovers
    // fetchMarketMovers does not take date range, it gets current movers.
    const marketMoversLimit = 100; // Fetch a good number to ensure we cover potential matches
    const netForeignMovers: MarketMoverItem[] = await fetchMarketMovers('net-foreign-buy', marketMoversLimit);

    // Filter by minimum net foreign value
    const filteredForeignStocks = netForeignMovers.filter(item =>
      (item.net_foreign_buy || 0) >= minNetForeignValue
    );

    // Collect all unique stock codes from filtered foreign stocks
    filteredForeignStocks.forEach(stock => uniqueStockCodes.add(stock.symbol));

    // 2. For each unique stock, fetch combined broker activity for selected Smartmoney brokers
    // This part still uses fromDate and toDate based on nDays
    for (const stockCode of uniqueStockCodes) {
      let smartMoneyNetValue = 0;
      let smartMoneyTotalBuyValue = 0;
      let smartMoneyTotalBuyLot = 0;
      const brokersInvolved: string[] = [];

      // Fetch broker activity for ALL selected smart money brokers for this stock
      const brokerActivity = await fetchBrokerActivityDetail(
        smartMoneyBrokerCodes.join(','), // Pass all selected brokers
        fromDate,
        toDate,
        1, // page
        50, // limit
        'TRANSACTION_TYPE_NET',
        'MARKET_BOARD_REGULER',
        'INVESTOR_TYPE_ALL'
      );

      if (brokerActivity.data && brokerActivity.data.broker_summary) {
        const allBrokerStockActivities: { [key: string]: { net_value: number; buy_value: number; buy_lot: number; } } = {};

        // Aggregate buys for the current stockCode
        brokerActivity.data.broker_summary.brokers_buy.forEach((item: BrokerBuyItem) => {
          if (item.netbs_stock_code === stockCode) {
            const broker = item.netbs_broker_code;
            if (!allBrokerStockActivities[broker]) {
              allBrokerStockActivities[broker] = { net_value: 0, buy_value: 0, buy_lot: 0 };
            }
            allBrokerStockActivities[broker].net_value += parseFloat(item.bval);
            allBrokerStockActivities[broker].buy_value += parseFloat(item.bval);
            allBrokerStockActivities[broker].buy_lot += parseFloat(item.blot);
          }
        });

        // Aggregate sells for the current stockCode
        brokerActivity.data.broker_summary.brokers_sell.forEach((item: BrokerSellItem) => {
          if (item.netbs_stock_code === stockCode) {
            const broker = item.netbs_broker_code;
            if (!allBrokerStockActivities[broker]) {
              allBrokerStockActivities[broker] = { net_value: 0, buy_value: 0, buy_lot: 0 };
            }
            allBrokerStockActivities[broker].net_value -= Math.abs(parseFloat(item.sval));
          }
        });

        // Sum up for selected smart money brokers for the current stockCode
        for (const brokerCode of smartMoneyBrokerCodes) {
          if (allBrokerStockActivities[brokerCode]) {
            smartMoneyNetValue += allBrokerStockActivities[brokerCode].net_value;
            smartMoneyTotalBuyValue += allBrokerStockActivities[brokerCode].buy_value;
            smartMoneyTotalBuyLot += allBrokerStockActivities[brokerCode].buy_lot;
            if (allBrokerStockActivities[brokerCode].net_value > 0) { // Only add if they actually net bought
              brokersInvolved.push(brokerCode);
            }
          }
        }
      }

      // 3. Apply Smart Money Net Value filter
      if (smartMoneyNetValue >= minSmartMoneyNetValue) {
        const foreignStockData = filteredForeignStocks.find(s => s.symbol === stockCode);
        if (foreignStockData) {
          let avgPriceSmartMoney = 0;
          if (smartMoneyTotalBuyLot > 0) {
            avgPriceSmartMoney = smartMoneyTotalBuyValue / smartMoneyTotalBuyLot;
          }

          // Fetch current price and change for display
          let lastPrice: number | undefined;
          let changePercentage: number | undefined;
          try {
            const emitenInfo = await fetchEmitenInfo(stockCode);
            lastPrice = parseFloat(emitenInfo.data?.price || '0');
            changePercentage = emitenInfo.data?.percentage;
          } catch (infoError) {
            console.warn(`Failed to fetch emiten info for ${stockCode}:`, infoError);
          }

          screenerResults.push({
            symbol: stockCode,
            stock_name: foreignStockData.name,
            net_foreign_buy_value: foreignStockData.net_foreign_buy || 0,
            smart_money_net_value: smartMoneyNetValue,
            smart_money_brokers_involved: Array.from(new Set(brokersInvolved)),
            avg_price_smart_money: avgPriceSmartMoney,
            last_price: lastPrice,
            change_percentage: changePercentage,
          });
        }
      }
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