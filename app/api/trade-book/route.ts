import { NextRequest, NextResponse } from 'next/server';
import { fetchTradeBook } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const tradeBookData = await fetchTradeBook(symbol);

    if (!tradeBookData) {
      return NextResponse.json(
        { success: false, error: 'No trade book data found for this symbol' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tradeBookData,
    });
  } catch (error) {
    console.error('Trade Book API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch trade book data' },
      { status: 500 }
    );
  }
}