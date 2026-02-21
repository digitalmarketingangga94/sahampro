import { NextRequest, NextResponse } from 'next/server';
import { fetchTopStocks } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const investorType = searchParams.get('investorType') || 'INVESTOR_TYPE_ALL';
    const marketType = searchParams.get('marketType') || 'MARKET_TYPE_REGULER';
    const valueType = searchParams.get('valueType') || 'VALUE_TYPE_NET';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: startDate, endDate' },
        { status: 400 }
      );
    }

    const topStocks = await fetchTopStocks(
      startDate,
      endDate,
      investorType,
      marketType,
      valueType,
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      data: topStocks.data,
    });
  } catch (error) {
    console.error('Top Stock API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch top stock data' },
      { status: 500 }
    );
  }
}