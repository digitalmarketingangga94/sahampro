import { NextRequest, NextResponse } from 'next/server';
import { fetchStockbitSearch } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!keyword) {
      return NextResponse.json({ success: true, data: [] });
    }

    const searchResults = await fetchStockbitSearch(keyword, limit);

    // Map to a simpler format for the frontend
    const formattedResults = searchResults.map(item => ({
      code: item.symbol_2,
      name: item.name,
    }));

    return NextResponse.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error('Stock Search API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}