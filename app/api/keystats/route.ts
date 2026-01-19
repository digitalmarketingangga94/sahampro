import { NextRequest, NextResponse } from 'next/server';
import { fetchKeyStats } from '@/lib/stockbit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten');

    if (!emiten) {
      return NextResponse.json(
        { success: false, error: 'Emiten parameter is required' },
        { status: 400 }
      );
    }

    const keyStats = await fetchKeyStats(emiten.toUpperCase());

    return NextResponse.json({
      success: true,
      data: keyStats,
    });
  } catch (error) {
    console.error('KeyStats API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch key stats' },
      { status: 500 }
    );
  }
}
