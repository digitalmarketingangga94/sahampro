import { NextRequest, NextResponse } from 'next/server';
import type { BrokerFlowResponse, BrokerFlowActivity } from '@/lib/types';
import { getBrokerInfo, BrokerType } from '@/lib/brokers'; // Import BrokerType
import { fetchTradersahamBrokerFlow } from '@/lib/stockbit'; // Import the updated function

// Helper to map frontend status IDs to internal BrokerType
const mapStatusIdToBrokerType = (statusId: string): BrokerType | null => {
  switch (statusId) {
    case 'Bandar': return 'Smartmoney';
    case 'Foreign': return 'Foreign';
    case 'Retail': return 'Retail';
    case 'Mix': return 'Mix';
    default: return null;
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const emiten = searchParams.get('emiten');
  const lookbackDays = searchParams.get('lookback_days') || '7';
  const brokerStatusParam = searchParams.get('broker_status') || 'Bandar,Foreign,Retail,Mix';
  const netDirection = searchParams.get('netDirection') || 'all'; // Get netDirection filter

  if (!emiten) {
    return NextResponse.json(
      { success: false, error: 'Missing emiten parameter' },
      { status: 400 }
    );
  }

  try {
    let allActivities: BrokerFlowActivity[] = [];
    let tradingDates: string[] = [];

    if (netDirection === 'net_buy') {
      const accumData = await fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'accum');
      allActivities = accumData.activities;
      tradingDates = accumData.trading_dates;
    } else if (netDirection === 'net_sell') {
      const distribData = await fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'distrib');
      allActivities = distribData.activities;
      tradingDates = distribData.trading_dates;
    } else { // 'all' mode
      const [accumData, distribData] = await Promise.all([
        fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'accum'),
        fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'distrib'),
      ]);

      // Combine activities, ensuring unique broker-stock pairs if necessary
      // For Tradersaham API, activities from 'accum' and 'distrib' modes are distinct by net_value sign,
      // so a simple concatenation should work.
      allActivities = [...accumData.activities, ...distribData.activities];
      // Use trading dates from one of them, assuming they are consistent
      tradingDates = accumData.trading_dates;
    }

    if (allActivities) {
      // First, map 'Whale' from external API response back to 'Foreign' for consistency
      allActivities = allActivities.map(activity => {
        const totalBuyValue = parseFloat(activity.total_buy_value);
        const totalBuyVolume = parseFloat(activity.total_buy_volume);
        let buyAvgPrice = 0;

        if (totalBuyVolume > 0) {
          buyAvgPrice = totalBuyValue / (totalBuyVolume * 100);
        }

        return {
          ...activity,
          broker_status: activity.broker_status === 'Whale' ? 'Foreign' : activity.broker_status,
          buy_avg_price: Math.round(buyAvgPrice),
        };
      });

      // Now, filter activities based on our internal broker definitions
      const selectedInternalBrokerTypes = brokerStatusParam.split(',')
        .map(mapStatusIdToBrokerType)
        .filter((type): type is BrokerType => type !== null);

      let filteredActivities = allActivities.filter(activity => {
        const brokerInfo = getBrokerInfo(activity.broker_code);
        return selectedInternalBrokerTypes.includes(brokerInfo.type);
      });

      // The netDirection filter is now handled by the mode parameter in fetchTradersahamBrokerFlow,
      // so we don't need to re-filter by net_value here unless there's a specific reason.
      // However, for 'all' mode, we might get both positive and negative net_value,
      // so we should ensure the net_value is correctly signed.
      // The Tradersaham API already provides net_value with the correct sign for 'accum' and 'distrib'.

      return NextResponse.json({
        success: true,
        data: {
          trading_dates: tradingDates,
          total_trading_days: tradingDates.length,
          sort_by: 'consistency', // This is hardcoded in the API call
          activities: filteredActivities,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trading_dates: [],
        total_trading_days: 0,
        sort_by: 'consistency',
        activities: [],
      },
    });

  } catch (error) {
    console.error('Broker Flow API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker flow data' },
      { status: 500 }
    );
  }
}