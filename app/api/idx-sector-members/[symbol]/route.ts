import { NextRequest, NextResponse } from 'next/server';
import type { IdxSectorMemberStock } from '@/lib/types';
import { fetchIdxSectorCompanyMembers } from '@/lib/stockbit';

// Temporary mapping for IDX symbols to their corresponding sector and subsector IDs.
// This is a placeholder as there's no direct API to get these IDs from the IDX symbol.
// For IDXTECHNO, using the example IDs provided by the user.
const IDX_SYMBOL_TO_SECTOR_IDS: Record<string, { sectorId: string; subSectorId: string }> = {
  'IDXTECHNO': { sectorId: '70', subSectorId: '1000003301' },
  // Add more mappings here if needed for other IDX indices.
  // Example: 'IDXENERGY': { sectorId: '...', subSectorId: '...' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  let symbol: string; // Declare symbol here to make it accessible in catch block
  try {
    const awaitedParams = await params;
    symbol = awaitedParams.symbol; // Assign to the outer-scoped symbol

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    const sectorIds = IDX_SYMBOL_TO_SECTOR_IDS[symbol.toUpperCase()];

    if (!sectorIds) {
      return NextResponse.json(
        { success: false, error: `No sector/subsector IDs found for IDX symbol: ${symbol}. Please add a mapping.` },
        { status: 404 }
      );
    }

    const companyResponse = await fetchIdxSectorCompanyMembers(sectorIds.sectorId, sectorIds.subSectorId);

    if (!companyResponse.data || companyResponse.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        indexSymbol: symbol.toUpperCase(),
        message: 'No company data found for this sector/subsector.',
      });
    }

    // Map the raw API response to the IdxSectorMemberStock interface
    const stocks: IdxSectorMemberStock[] = companyResponse.data.map(item => ({
      symbol: item.symbol_2 || item.symbol,
      name: item.name,
      last_price: parseFloat(item.last),
      change_point: parseFloat(item.change),
      change_percentage: parseFloat(item.percent),
      volume: item.volume,
      value: item.value,
    }));

    return NextResponse.json({
      success: true,
      data: stocks,
      indexSymbol: symbol.toUpperCase(),
    });
  } catch (error) {
    // Use the 'symbol' variable that was already awaited
    console.error(`Error fetching IDX sector members for ${symbol}:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch IDX sector members' },
      { status: 500 }
    );
  }
}