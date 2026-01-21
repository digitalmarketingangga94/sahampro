import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketMovers } from '@/lib/stockbit';
import type { MarketMoverType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as MarketMoverType;
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!type || !['gainer', 'loser', 'value', 'volume', 'frequency'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing "type" parameter' },
        { status: 400 }
      );
    }

    const movers = await fetchMarketMovers(type, limit);

    return NextResponse.json({
      success: true,
      data: movers.data.result,
    });
  } catch (error) {
    console.error(`Market Movers API (${request.nextUrl.searchParams.get('type')}) error:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch market movers' },
      { status: 500 }
    );
  }
}