import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { emiten, flag } = await request.json();

        if (!emiten || !flag) {
            return NextResponse.json(
                { success: false, error: 'Emiten and flag are required' },
                { status: 400 }
            );
        }

        if (!['OK', 'NG', 'Neutral'].includes(flag)) {
            return NextResponse.json(
                { success: false, error: 'Invalid flag value. Must be OK, NG, or Neutral' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('emiten_flags')
            .upsert({ emiten: emiten.toUpperCase(), flag, updated_at: new Date().toISOString() })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Flag API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const emiten = searchParams.get('emiten');

        if (!emiten) {
            return NextResponse.json(
                { success: false, error: 'Emiten is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('emiten_flags')
            .select('flag')
            .eq('emiten', emiten.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is single record not found
            throw error;
        }

        return NextResponse.json({ success: true, flag: data?.flag || null });
    } catch (error) {
        console.error('Flag API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
