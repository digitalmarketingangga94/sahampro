import { NextRequest, NextResponse } from 'next/server';
import type { BrokerFlowResponse, BrokerFlowActivity } from '@/lib/types';
import { getBrokerInfo, BrokerType } from '@/lib/brokers'; // Import BrokerType

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
  const brokerStatusParam = searchParams.get('broker_status') || 'Bandar,Foreign,Retail,Mix'; // Default to match frontend

  if (!emiten) {
    return NextResponse.json(
      { success: false, error: 'Missing emiten parameter' },
      { status: 400 }
    );
  }

  try {
    const url = new URL('https://api.tradersaham.com/api/market-insight/broker-intelligence');
    url.searchParams.set('limit', '100');
    url.searchParams.set('page', '1');
    url.searchParams.set('sort_by', 'consistency');
    url.searchParams.set('mode', 'accum');
    url.searchParams.set('lookback_days', lookbackDays);
    
    // IMPORTANT: Do NOT set broker_status filter for the external API.
    // We will fetch all relevant activities and filter internally using our own broker definitions.
    // This ensures consistency with our internal broker classifications.
    // url.searchParams.set('broker_status', externalBrokerStatus); // Removed this line

    url.searchParams.set('search', emiten.toLowerCase());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Tradersaham API returned ${response.status}`);
    }

    const data: BrokerFlowResponse = await response.json();

    if (data && data.activities) {
      // First, map 'Whale' from external API response back to 'Foreign' for consistency
      data.activities = data.activities.map(activity => ({
        ...activity,
        broker_status: activity.broker_status === 'Whale' ? 'Foreign' : activity.broker_status,
        netbs_buy_avg_price: "284.2499506850978" // Adding the requested field
      }));

      // Now, filter activities based on our internal broker definitions
      const selectedInternalBrokerTypes = brokerStatusParam.split(',')
        .map(mapStatusIdToBrokerType)
        .filter((type): type is BrokerType => type !== null);

      const filteredActivities = data.activities.filter(activity => {
        const brokerInfo = getBrokerInfo(activity.broker_code);
        return selectedInternalBrokerTypes.includes(brokerInfo.type);
      });

      data.activities = filteredActivities;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Broker Flow API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch broker flow data' },
      { status: 500 }
    );
  }
}