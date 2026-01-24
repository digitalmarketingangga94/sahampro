import { NextRequest, NextResponse } from 'next/server';
import { fetchBrokerActivityDetail, fetchEmitenInfo } from '@/lib/stockbit';
import type { BrokerOverallActivitySummaryResponse, BrokerBuyItem, BrokerSellItem, BrokerStockActivityPerBroker } from '@/lib/types';
import { BROKERS } from '@/lib/brokers'; // Import BROKERS to get broker type

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerCodesParam = searchParams.get('brokerCodes');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const transactionType = searchParams.get('transactionType') || 'TRANSACTION_TYPE_NET';
    const marketBoard = searchParams.get('marketBoard') || 'MARKET_BOARD_REGULER';
    const investorType = searchParams.get('investorType') || 'INVESTOR_TYPE_ALL';

    if (!brokerCodesParam || !fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: brokerCodes, fromDate, toDate' },
        { status: 400 }
      );
    }

    const brokerCodes = brokerCodesParam.split(',').map(code => code.trim().toUpperCase());

    const allBrokerStockActivities: BrokerStockActivityPerBroker[] = [];
    const uniqueStockCodes = new Set<string>();

    for (const brokerCode of brokerCodes) {
      const brokerOverallActivity = await fetchBrokerActivityDetail(
        brokerCode,
        fromDate,
        toDate,
        page,
        limit,
        transactionType,
        marketBoard,
        investorType
      );

      if (brokerOverallActivity.data) {
        const brokerInfo = BROKERS[brokerCode] || { type: 'Unknown' };

        // Use a temporary map to handle buys and sells for the same stock by the same broker
        const tempStockMap = new Map<string, BrokerStockActivityPerBroker>();

        // Process buys for this specific broker
        brokerOverallActivity.data.broker_summary.brokers_buy.forEach((item: BrokerBuyItem) => {
          const stockCode = item.netbs_stock_code;
          uniqueStockCodes.add(stockCode);
          const existing = tempStockMap.get(stockCode);

          if (existing) {
            existing.buy_value += parseFloat(item.bval);
            existing.buy_lot += parseFloat(item.blot);
            existing.buy_avg_price = parseFloat(item.netbs_buy_avg_price); // Assuming last avg price is fine
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
          } else {
            tempStockMap.set(stockCode, {
              broker_code: brokerCode,
              stock_code: stockCode,
              broker_type: brokerInfo.type,
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

        // Process sells for this specific broker
        brokerOverallActivity.data.broker_summary.brokers_sell.forEach((item: BrokerSellItem) => {
          const stockCode = item.netbs_stock_code;
          uniqueStockCodes.add(stockCode);
          const existing = tempStockMap.get(stockCode);

          if (existing) {
            existing.sell_value += Math.abs(parseFloat(item.sval));
            existing.sell_lot += Math.abs(parseFloat(item.slot));
            existing.sell_avg_price = parseFloat(item.netbs_sell_avg_price); // Assuming last avg price is fine
            existing.net_value = existing.buy_value - existing.sell_value;
            existing.net_lot = existing.buy_lot - existing.sell_lot;
          } else {
            tempStockMap.set(stockCode, {
              broker_code: brokerCode,
              stock_code: stockCode,
              broker_type: brokerInfo.type,
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
        allBrokerStockActivities.push(...Array.from(tempStockMap.values()));
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

    // Add stock names to allBrokerStockActivities
    const finalActivities = allBrokerStockActivities.map(activity => ({
      ...activity,
      stock_name: stockNameMap.get(activity.stock_code),
    })).sort((a, b) => (b.net_value || 0) - (a.net_value || 0)); // Sort by net value descending

    return NextResponse.json({
      success: true,
      data: finalActivities, // Return the processed and combined data
      message: 'Successfully retrieved combined broker activity detail',
    });
  } catch (error) {
    console.error('Broker Activity Detail API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker activity detail data' },
      { status: 500 }
    );
  }
}