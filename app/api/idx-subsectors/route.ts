import { NextRequest, NextResponse } from 'next/server';
import { fetchIdxSubsectors } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    // The user's example URL uses sector ID '70'
    const sectorId = '70';
    const subsectors = await fetchIdxSubsectors(sectorId);

    return NextResponse.json({
      success: true,
      data: subsectors.data,
    });
  } catch (error) {
    console.error('IDX Subsectors API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch IDX subsectors' },
      { status: 500 }
    );
  }
}