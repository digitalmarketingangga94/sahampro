import { NextRequest, NextResponse } from 'next/server';
import type { IdxSectorMemberStock, IdxSubsectorItem } from '@/lib/types'; // Import IdxSubsectorItem
import { fetchIdxSectorCompanyMembers, fetchIdxSubsectors } from '@/lib/stockbit'; // Import fetchIdxSubsectors

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  let symbol: string = ''; // Initialize symbol to an empty string
  try {
    const awaitedParams = await params;
    symbol = awaitedParams.symbol; // Assign to the outer-scoped symbol

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    // Dynamically fetch subsectors to find the correct IDs
    const mainSectorId = '70'; // As per user's example for the subsectors API
    const subsectorsResponse = await fetchIdxSubsectors(mainSectorId);
    const subsector = subsectorsResponse.data.find(s => s.name.toUpperCase() === symbol.toUpperCase());

    if (!subsector) {
      return NextResponse.json(
        { success: false, error: `No subsector found for IDX symbol: ${symbol}.` },
        { status: 404 }
      );
    }

    const sectorId = mainSectorId; // The parent ID is '70'
    const subSectorId = subsector.id; // The ID from the subsector item

    const companyResponse = await fetchIdxSectorCompanyMembers(sectorId, subSectorId);

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