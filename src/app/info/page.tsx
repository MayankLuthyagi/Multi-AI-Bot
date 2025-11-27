'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Coin {
    _id: string;
    symbol: string;
    createdAt: string;
    history: Array<{ price: number; timestamp: string }>;
}

export default function InfoPage() {
    const [coins, setCoins] = useState<Coin[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSymbol, setNewSymbol] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Fetch all coins
    const fetchCoins = async () => {
        try {
            const response = await fetch('/api/coins');
            const data = await response.json();

            if (data.success) {
                setCoins(data.coins);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching coins:', err);
            setLoading(false);
        }
    };

    // Add new coin
    const handleAddCoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSymbol.trim()) return;

        setError('');
        setAdding(true);

        try {
            const response = await fetch('/api/coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol: newSymbol.toUpperCase() }),
            });

            const data = await response.json();

            if (data.success) {
                setNewSymbol('');
                await fetchCoins();
                // Optionally navigate to the coin page
                router.push(`/coins/${data.coin.symbol}`);
            } else {
                setError(data.error || 'Failed to add coin');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setAdding(false);
        }
    };

    useEffect(() => {
        fetchCoins();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Cryptocurrency Tracker</h1>
                    <p className="text-gray-600">
                        Track real-time cryptocurrency prices from CoinDCX
                    </p>
                </div>

                {/* Add Coin Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <form onSubmit={handleAddCoin} className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                                placeholder="Enter coin symbol (e.g., BTCUSDT)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={adding}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={adding || !newSymbol.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {adding ? 'Adding...' : 'Add Coin'}
                        </button>
                    </form>
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <p className="mt-3 text-sm text-gray-500">
                        Supported symbols: BTCUSDT, ETHUSDT, SHIBUSDT, etc. Check CoinDCX for available markets.
                    </p>
                </div>

                {/* Coins List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Tracked Coins ({coins.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading coins...</p>
                        </div>
                    ) : coins.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📊</div>
                            <p className="text-gray-600 mb-2">No coins tracked yet</p>
                            <p className="text-sm text-gray-500">Add a coin above to start tracking</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coins.map((coin) => (
                                <div
                                    key={coin._id}
                                    onClick={() => router.push(`/coins/${coin.symbol}`)}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-white"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">{coin.symbol}</h3>
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p>Added: {new Date(coin.createdAt).toLocaleDateString()}</p>
                                        <p className="mt-1">
                                            History: {coin.history.length} entries
                                        </p>
                                    </div>
                                    <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
                                        View Details →
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Add cryptocurrency symbols from CoinDCX (e.g., BTCUSDT, ETHUSDT)</li>
                        <li>• Real-time prices are fetched every 2 seconds</li>
                        <li>• Price history is automatically recorded every 10 seconds</li>
                        <li>• View interactive charts and historical data for each coin</li>
                        <li>• Click on any coin card to see detailed information</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
