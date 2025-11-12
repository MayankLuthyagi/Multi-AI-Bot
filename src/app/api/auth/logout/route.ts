import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/src/lib/session';

export async function POST(req: NextRequest) {
    try {
        await destroySession();
        return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}
