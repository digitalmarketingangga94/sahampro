import { NextResponse } from 'next/server';
import { fetchSectorPerformance } from '@/lib/stockbit';
import { getLatestTradingDate } from '@/lib/utils';

export async function GET() {
  try {
    const performanceData = await fetchSectorPerformance();
    const lastUpdatedDate = getLatestTradingDate();

    return NextResponse.json({
      success: true,
      data: performanceData,
      lastUpdated: lastUpdatedDate,
    });
  } catch (error) {
    console.error('Sector Performance API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}