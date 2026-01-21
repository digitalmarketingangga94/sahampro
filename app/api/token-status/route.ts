import { NextResponse } from 'next/server';
import { getTokenStatus } from '@/lib/supabase';

export async function GET() {
  try {
    const status = await getTokenStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching token status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token status' },
      { status: 500 }
    );
  }
}
