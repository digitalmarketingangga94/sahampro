import { NextResponse } from 'next/server';
import { fetchIHSGForeignDomesticChart } from '@/lib/stockbit';
import type { IHSGForeignDomesticChartResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketType = searchParams.get('market_type') || 'MARKET_TYPE_REGULAR';
    const period = searchParams.get('period') || 'PERIOD_RANGE_1D';

    const ihsgFdData: IHSGForeignDomesticChartResponse = await fetchIHSGForeignDomesticChart(marketType, period);

    return NextResponse.json({ success: true, data: ihsgFdData.data });
  } catch (error) {
    console.error('IHSG Foreign Domestic Chart API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}