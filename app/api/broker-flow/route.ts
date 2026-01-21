import { NextRequest, NextResponse } from 'next/server';
import type { BrokerFlowResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const emiten = searchParams.get('emiten');
  const lookbackDays = searchParams.get('lookback_days') || '7';
  const brokerStatus = searchParams.get('broker_status') || 'Bandar,Whale,Retail,Mix';

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
    url.searchParams.set('broker_status', brokerStatus);
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
