import { NextRequest, NextResponse } from 'next/server';
import { fetchIdxSectorInfo } from '@/lib/stockbit';
import type { EmitenInfoResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    const sectorInfo: EmitenInfoResponse = await fetchIdxSectorInfo(symbol.toUpperCase());

    return NextResponse.json({
      success: true,
      data: sectorInfo.data,
    });
  } catch (error) {
    console.error('IDX Sector Info API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch IDX sector info' },
      { status: 500 }
    );
  }
}