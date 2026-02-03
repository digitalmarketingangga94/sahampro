import { NextRequest, NextResponse } from 'next/server';
import { fetchStockScreener } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Missing templateId parameter' },
        { status: 400 }
      );
    }

    const screenerData = await fetchStockScreener(templateId, page, limit);

    return NextResponse.json({
      success: true,
      data: screenerData.data.calcs,
      columns: screenerData.data.columns,
      totalRows: screenerData.data.totalrows,
      currentPage: screenerData.data.curpage,
      perPage: screenerData.data.perpage,
    });
  } catch (error) {
    console.error('Stock Screener API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stock screener data' },
      { status: 500 }
    );
  }
}