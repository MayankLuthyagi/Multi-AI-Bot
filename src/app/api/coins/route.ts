import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Coin, CoinCollection } from '@/src/lib/models/Coin';

// POST /api/coins - Add a new coin
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbol } = body;

        if (!symbol || typeof symbol !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Symbol is required' },
                { status: 400 }
            );
        }

        // Convert to uppercase
        const upperSymbol = symbol.toUpperCase().trim();

        // Connect to database
        const { db } = await connectToDatabase();

        // Check if coin already exists
        const existingCoin = await db.collection<Coin>(CoinCollection).findOne({ symbol: upperSymbol });

        if (existingCoin) {
            return NextResponse.json(
                { success: false, error: 'Coin already exists' },
                { status: 409 }
            );
        }

        // Create new coin
        const newCoin: Coin = {
            symbol: upperSymbol,
            createdAt: new Date(),
            history: []
        };

        const result = await db.collection<Coin>(CoinCollection).insertOne(newCoin);

        return NextResponse.json({
            success: true,
            coin: {
                _id: result.insertedId,
                ...newCoin
            }
        });

    } catch (error: any) {
        console.error('Error adding coin:', error);
        return NextResponse.json(
            { success: false, error: `Failed to add coin: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}

// GET /api/coins - Get all coins
export async function GET() {
    try {
        const { db } = await connectToDatabase();

        const coins = await db.collection<Coin>(CoinCollection)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            coins
        });

    } catch (error: any) {
        console.error('Error fetching coins:', error);
        return NextResponse.json(
            { success: false, error: `Failed to fetch coins: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
