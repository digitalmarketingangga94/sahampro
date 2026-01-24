import { NextRequest, NextResponse } from 'next/server';
import { fetchWatchlist, fetchEmitenInfo, TokenExpiredError } from '@/lib/stockbit'; // Import TokenExpiredError
import { supabase } from '@/lib/supabase';
import type { ApiResponse, WatchlistItem, WatchlistResponse } from '@/lib/types'; // Import WatchlistItem and WatchlistResponse

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const watchlistData: WatchlistResponse = await fetchWatchlist(groupId ? Number(groupId) : undefined);

    // Get list of symbols
    const items: WatchlistItem[] = watchlistData.data?.result || [];

    if (items.length === 0) {
      return NextResponse.json<ApiResponse<WatchlistResponse>>({ // Specify generic type
        success: true,
        data: watchlistData
      });
    }

    const symbols = items.map((item) => (item.symbol || item.company_code).toUpperCase());

    // Fetch flags from Supabase
    const { data: flags, error: flagError } = await supabase
      .from('emiten_flags')
      .select('emiten, flag')
      .in('emiten', symbols);

    if (flagError) {
      console.error('Error fetching flags:', flagError);
      // Continue without flags if there's an error, don't block the whole watchlist
    }

    // Create a map for faster lookup
    const flagMap = new Map<string, 'OK' | 'NG' | 'Neutral' | null>();
    if (flags) {
      flags.forEach((f: { emiten: string; flag: 'OK' | 'NG' | 'Neutral' }) => flagMap.set(f.emiten, f.flag));
    }

    // Fetch sector for each watchlist item in parallel AND merge flags
    const itemsWithData = await Promise.all(
      items.map(async (item) => {
        const symbol = (item.symbol || item.company_code).toUpperCase();
        let sector: string | undefined = undefined;
        try {
          const emitenInfo = await fetchEmitenInfo(symbol);
          sector = emitenInfo?.data?.sector || undefined;
        } catch (infoError) {
          console.warn(`Failed to fetch emiten info for ${symbol}:`, infoError);
          // Continue without sector if fetch fails
        }
        
        return {
          ...item,
          sector: sector,
          flag: flagMap.get(symbol) || null
        };
      })
    );

    // Update the response with sector and flag data
    const updatedData: WatchlistResponse = {
      ...watchlistData,
      data: {
        ...watchlistData.data,
        result: itemsWithData
      }
    };

    return NextResponse.json<ApiResponse<WatchlistResponse>>({ // Specify generic type
      success: true,
      data: updatedData
    });

  } catch (error) {
    console.error('Watchlist API Error:', error);

    if (error instanceof TokenExpiredError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 } // Return 401 for token expiry
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}