import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Coin, CoinCollection, HistoryEntry } from '@/src/lib/models/Coin';

// GET /api/coins/cron - Update all tracked coins
export async function GET(request: NextRequest) {
    try {
        // Optional: Add authentication/secret key for security
        // For Vercel Cron, check the Vercel-specific header
        const authHeader = request.headers.get('authorization');
        const vercelCron = request.headers.get('x-vercel-cron');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

        // Allow requests from Vercel Cron or with valid Bearer token
        const isAuthorized = vercelCron || authHeader === `Bearer ${cronSecret}`;

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { db } = await connectToDatabase();

        // Get all tracked coins
        const coins = await db.collection<Coin>(CoinCollection).find({}).toArray();

        if (coins.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No coins to update',
                updated: 0
            });
        }

        // Fetch all tickers from CoinDCX once
        const response = await fetch('https://api.coindcx.com/exchange/ticker', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch prices from CoinDCX' },
                { status: 500 }
            );
        }

        const tickers = await response.json();
        const timestamp = new Date();
        const updates: any[] = [];
        const errors: any[] = [];

        // Update each coin
        for (const coin of coins) {
            try {
                // Find ticker for this coin
                const ticker = tickers.find((item: any) => item.market === coin.symbol);

                if (!ticker) {
                    errors.push({
                        symbol: coin.symbol,
                        error: 'Ticker not found on CoinDCX'
                    });
                    continue;
                }

                const price = Number(ticker.last_price);

                // Create history entry
                const historyEntry: HistoryEntry = {
                    price,
                    timestamp
                };

                // Update coin in database
                await db.collection<Coin>(CoinCollection).updateOne(
                    { symbol: coin.symbol },
                    {
                        $push: { history: historyEntry }
                    }
                );

                updates.push({
                    symbol: coin.symbol,
                    price,
                    timestamp
                });

            } catch (error: any) {
                errors.push({
                    symbol: coin.symbol,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} coins`,
            updated: updates.length,
            failed: errors.length,
            updates,
            errors: errors.length > 0 ? errors : undefined,
            timestamp
        });

    } catch (error: any) {
        console.error('Error in cron job:', error);
        return NextResponse.json(
            { success: false, error: `Cron job failed: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}

// POST /api/coins/cron - Manual trigger (same functionality)
export async function POST(request: NextRequest) {
    return GET(request);
}
