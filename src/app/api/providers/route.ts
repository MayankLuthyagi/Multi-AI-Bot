import { NextResponse } from 'next/server';
import { PROVIDER_TEMPLATES } from '@/src/lib/models/Modal';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            providers: PROVIDER_TEMPLATES
        });
    } catch (error) {
        console.error('Error fetching providers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch providers' },
            { status: 500 }
        );
    }
}
