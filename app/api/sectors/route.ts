import { NextResponse } from 'next/server';
import { fetchSectors } from '@/lib/stockbit';
import type { IdxSector } from '@/lib/types'; // Import IdxSector

export async function GET() {
  try {
    const sectors: IdxSector[] = await fetchSectors(); // Now returns IdxSector[]

    return NextResponse.json({
      success: true,
      data: sectors
    });

  } catch (error) {
    console.error('Sectors API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}