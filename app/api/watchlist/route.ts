import { NextRequest, NextResponse } from 'next/server';
import { fetchWatchlist, fetchEmitenInfo } from '@/lib/stockbit';
import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const watchlistData = await fetchWatchlist(groupId ? Number(groupId) : undefined);

    // Get list of symbols
    const items = watchlistData.data?.result || [];

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        data: watchlistData
      });
    }

    const symbols = items.map((item: any) => (item.symbol || item.company_code).toUpperCase());

    // Fetch flags from Supabase
    const { data: flags, error: flagError } = await supabase
      .from('emiten_flags')
      .select('emiten, flag')
      .in('emiten', symbols);

    if (flagError) {
      console.error('Error fetching flags:', flagError);
    }

    // Create a map for faster lookup
    const flagMap = new Map<string, string>();
    if (flags) {
      flags.forEach((f: any) => flagMap.set(f.emiten, f.flag));
    }

    // Fetch sector for each watchlist item in parallel AND merge flags
    const itemsWithData = await Promise.all(
      items.map(async (item: any) => {
        try {
          const symbol = (item.symbol || item.company_code).toUpperCase();
          const emitenInfo = await fetchEmitenInfo(symbol);
          return {
            ...item,
            sector: emitenInfo?.data?.sector || undefined,
            flag: flagMap.get(symbol) || null
          };
        } catch {
          const symbol = (item.symbol || item.company_code).toUpperCase();
          return {
            ...item,
            flag: flagMap.get(symbol) || null
          }; // Return without sector if fetch fails, but keep flag
        }
      })
    );

    // Update the response with sector and flag data
    const updatedData = {
      ...watchlistData,
      data: {
        ...watchlistData.data,
        result: itemsWithData
      }
    };

    return NextResponse.json({
      success: true,
      data: updatedData
    });

  } catch (error) {
    console.error('Watchlist API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
