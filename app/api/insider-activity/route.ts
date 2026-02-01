import { NextRequest, NextResponse } from 'next/server';
import { fetchInsiderActivity } from '@/lib/stockbit';
import type { ActionType, SourceType } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten')?.toUpperCase(); // This can be undefined
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');
    const actionType = (searchParams.get('actionType') || 'ACTION_TYPE_UNSPECIFIED') as ActionType;
    const sourceType = (searchParams.get('sourceType') || 'SOURCE_TYPE_UNSPECIFIED') as SourceType;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Only dateStart and dateEnd are strictly required
    if (!dateStart || !dateEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: dateStart, dateEnd' },
        { status: 400 }
      );
    }

    const insiderActivity = await fetchInsiderActivity(
      emiten, // Pass emiten as string | undefined
      dateStart,
      dateEnd,
      actionType,
      sourceType,
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      data: insiderActivity.data.movement,
      isMore: insiderActivity.data.is_more,
    });
  } catch (error) {
    console.error('Insider Activity API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch insider activity data' },
      { status: 500 }
    );
  }
}