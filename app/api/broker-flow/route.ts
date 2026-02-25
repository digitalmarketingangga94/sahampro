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
    let activitiesToProcess: BrokerFlowActivity[] = [];
    let tradingDates: string[] = [];

    if (netDirection === 'net_buy') {
      const accumData = await fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'accum');
      activitiesToProcess = accumData.activities;
      tradingDates = accumData.trading_dates;
    } else if (netDirection === 'net_sell') {
      const distribData = await fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'distrib');
      activitiesToProcess = distribData.activities;
      tradingDates = distribData.trading_dates;
    } else { // 'all' mode - fetch both and aggregate
      const [accumData, distribData] = await Promise.all([
        fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'accum'),
        fetchTradersahamBrokerFlow(emiten, parseInt(lookbackDays), 'distrib'),
      ]);

      tradingDates = accumData.trading_dates; // Assume trading dates are consistent

      const aggregatedActivities = new Map<string, BrokerFlowActivity>();

      // Helper to add/update activity in the map
      const addOrUpdateActivity = (activity: BrokerFlowActivity) => {
        const key = `${activity.broker_code}-${activity.stock_code}`;
        if (aggregatedActivities.has(key)) {
          const existing = aggregatedActivities.get(key)!;
          // Aggregate values
          existing.net_value = String(parseFloat(existing.net_value) + parseFloat(activity.net_value));
          existing.total_buy_value = String(parseFloat(existing.total_buy_value) + parseFloat(activity.total_buy_value));
          existing.total_buy_volume = String(parseFloat(existing.total_buy_volume) + parseFloat(activity.total_buy_volume));
          // Take max for days, or sum if appropriate (here, max is safer for 'active_days')
          existing.buy_days = String(Math.max(parseFloat(existing.buy_days), parseFloat(activity.buy_days)));
          existing.active_days = String(Math.max(parseFloat(existing.active_days), parseFloat(activity.active_days)));
          // Consistency percentage might need recalculation or a more complex aggregation
          // For now, we'll just keep the one from the first entry or a simple average if needed.
          // For simplicity, let's just keep the first one's consistency_pct for now.
          // If a broker has both buy and sell, its consistency might be complex.
          // For now, we'll prioritize the 'accum' consistency if available, otherwise 'distrib'.
          // Or, a more robust approach would be to recalculate consistency based on combined daily data.
          // Given the current structure, let's just take the first one's consistency_pct.
          // The `dominant_percentage` will be recalculated later based on the final `net_value`.
        } else {
          aggregatedActivities.set(key, { ...activity });
        }
      };

      accumData.activities.forEach(addOrUpdateActivity);
      distribData.activities.forEach(addOrUpdateActivity);

      activitiesToProcess = Array.from(aggregatedActivities.values());
    }

    if (activitiesToProcess) {
      // First, map 'Whale' from external API response back to 'Foreign' for consistency
      let finalActivities = activitiesToProcess.map(activity => {
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

      finalActivities = finalActivities.filter(activity => {
        const brokerInfo = getBrokerInfo(activity.broker_code);
        return selectedInternalBrokerTypes.includes(brokerInfo.type);
      });

      return NextResponse.json({
        success: true,
        data: {
          trading_dates: tradingDates,
          total_trading_days: tradingDates.length,
          sort_by: 'consistency', // This is hardcoded in the API call
          activities: finalActivities,
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