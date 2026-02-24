import { NextRequest, NextResponse } from 'next/server';
import { fetchRunningTradeChart } from '@/lib/stockbit';
import type { RunningTradeChartResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten')?.toUpperCase();
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const investorType = searchParams.get('investorType') || 'INVESTOR_TYPE_ALL';
    const marketBoard = searchParams.get('marketBoard') || 'BOARD_TYPE_REGULAR';

    if (!emiten || !fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: emiten, fromDate, toDate' },
        { status: 400 }
      );
    }

    const chartData: RunningTradeChartResponse = await fetchRunningTradeChart(emiten, fromDate, toDate, investorType, marketBoard);

    return NextResponse.json({
      success: true,
      data: chartData.data,
    });
  } catch (error) {
    console.error('Running Trade Chart API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch running trade chart data' },
      { status: 500 }
    );
  }
}