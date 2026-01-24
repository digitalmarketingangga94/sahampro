import { NextResponse } from 'next/server';
import { getUniqueEmitens } from '@/lib/supabase';

export async function GET() {
  try {
    const emitens = await getUniqueEmitens();
    console.log('API /api/unique-emitens: Fetched emitens:', emitens); // Log untuk debugging
    return NextResponse.json({ success: true, data: emitens });
  } catch (error) {
    console.error('Unique Emitens API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}