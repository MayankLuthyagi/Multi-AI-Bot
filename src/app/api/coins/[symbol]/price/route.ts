import { NextRequest, NextResponse } from 'next/server';

// GET /api/coins/[symbol]/price - Fetch live price from CoinDCX
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ symbol: string }> }
) {
    try {
        const { symbol } = await context.params;

        if (!symbol) {
            return NextResponse.json(
                { success: false, error: 'Symbol is required' },
                { status: 400 }
            );
        }

        const upperSymbol = symbol.toUpperCase();

        // Fetch live ticker data from CoinDCX
        const response = await fetch('https://api.coindcx.com/exchange/ticker', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch price from CoinDCX' },
                { status: 500 }
            );
        }

        const tickers = await response.json();

        // Find the specific coin ticker
        const ticker = tickers.find((item: any) => item.market === upperSymbol);

        if (!ticker) {
            return NextResponse.json(
                { success: false, error: `Coin ${upperSymbol} not found on CoinDCX` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            symbol: upperSymbol,
            price: Number(ticker.last_price),
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Error fetching coin price:', error);
        return NextResponse.json(
            { success: false, error: `Failed to fetch price: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
