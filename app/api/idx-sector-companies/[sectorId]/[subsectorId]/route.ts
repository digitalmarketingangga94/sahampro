import { NextRequest, NextResponse } from 'next/server';
import { fetchIdxSectorCompanies } from '@/lib/stockbit';
import type { IdxSectorCompaniesResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectorId: string; subsectorId: string }> }
) {
  try {
    const { sectorId, subsectorId } = await params; // Await the params promise

    if (!sectorId || !subsectorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: sectorId, subsectorId' },
        { status: 400 }
      );
    }

    const companies: IdxSectorCompaniesResponse = await fetchIdxSectorCompanies(sectorId, subsectorId);

    return NextResponse.json({
      success: true,
      data: companies.data,
    });
  } catch (error) {
    console.error('IDX Sector Companies API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch IDX sector companies' },
      { status: 500 }
    );
  }
}