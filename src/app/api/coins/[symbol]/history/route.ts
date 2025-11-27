import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Coin, CoinCollection, HistoryEntry } from '@/src/lib/models/Coin';

// POST /api/coins/[symbol]/history - Append price to history
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await context.params;
        const body = await request.json();
        const { price } = body;

        if (!symbol) {
            return NextResponse.json(
                { success: false, error: 'Symbol is required' },
                { status: 400 }
            );
        }

        if (typeof price !== 'number' || isNaN(price)) {
            return NextResponse.json(
                { success: false, error: 'Valid price is required' },
                { status: 400 }
            );
        }

        const upperSymbol = symbol.toUpperCase();

        // Connect to database
        const { db } = await connectToDatabase();

        // Create history entry
        const historyEntry: HistoryEntry = {
            price,
            timestamp: new Date()
        };

        // Update coin by appending to history array
        const result = await db.collection<Coin>(CoinCollection).updateOne(
            { symbol: upperSymbol },
            {
                $push: { history: historyEntry }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: `Coin ${upperSymbol} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            symbol: upperSymbol,
            historyEntry
        });

    } catch (error: any) {
        console.error('Error updating coin history:', error);
        return NextResponse.json(
            { success: false, error: `Failed to update history: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
