import { NextResponse } from 'next/server';
import { fetchIHSGDailyChart } from '@/lib/stockbit';

export async function GET() {
  try {
    const ihsgData = await fetchIHSGDailyChart();
    return NextResponse.json({ success: true, data: ihsgData.data });
  } catch (error) {
    console.error('IHSG Daily Chart API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}