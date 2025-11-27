'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PriceChart from '@/src/components/PriceChart';

interface HistoryEntry {
    price: number;
    timestamp: string;
}

interface Coin {
    _id: string;
    symbol: string;
    createdAt: string;
    history: HistoryEntry[];
}

type TimeRange = '24h' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

export default function CoinDetailsPage({ params }: { params: Promise<{ symbol: string }> }) {
    const [symbol, setSymbol] = useState<string>('');
    const [coin, setCoin] = useState<Coin | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
    const router = useRouter();

    // Unwrap params
    useEffect(() => {
        params.then(p => setSymbol(p.symbol.toUpperCase()));
    }, [params]);

    // Fetch coin data from database (server-side)
    const fetchCoinData = async () => {
        if (!symbol) return;

        try {
            const response = await fetch('/api/coins');
            const data = await response.json();

            if (data.success) {
                const foundCoin = data.coins.find((c: Coin) => c.symbol === symbol);
                if (foundCoin) {
                    setCoin(foundCoin);
                } else {
                    setError(`Coin ${symbol} not found in database`);
                }
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch coin data');
            setLoading(false);
        }
    };

    // Fetch live price from CoinDCX
    const fetchLivePrice = async () => {
        if (!symbol) return;

        try {
            const response = await fetch(`/api/coins/${symbol}/price`);
            const data = await response.json();

            if (data.success) {
                setCurrentPrice(data.price);
                setLastUpdated(new Date(data.timestamp));
            } else {
                console.error('Failed to fetch price:', data.error);
            }
        } catch (err) {
            console.error('Error fetching price:', err);
        }
    };

    // Save price to history
    const savePriceToHistory = async (price: number) => {
        if (!symbol) return;

        try {
            await fetch(`/api/coins/${symbol}/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ price }),
            });

            // Refresh coin data to show updated history
            await fetchCoinData();
        } catch (err) {
            console.error('Error saving price to history:', err);
        }
    };

    // Initial data fetch
    useEffect(() => {
        if (symbol) {
            fetchCoinData();
            fetchLivePrice();
        }
    }, [symbol]);

    // Auto-refresh data every 5 seconds to show latest from database
    useEffect(() => {
        if (!symbol) return;

        const refreshInterval = setInterval(() => {
            fetchCoinData(); // Refresh coin data (includes history)
            fetchLivePrice(); // Refresh current price display
        }, 5000);

        return () => clearInterval(refreshInterval);
    }, [symbol]);

    // Filter history based on selected time range
    const filteredHistory = useMemo(() => {
        if (!coin || !coin.history.length) return [];

        const now = new Date();
        let cutoffDate = new Date();

        switch (selectedTimeRange) {
            case '24h':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '3m':
                cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6m':
                cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                return coin.history;
            default:
                return coin.history;
        }

        return coin.history.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    }, [coin, selectedTimeRange]);

    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: '24h', label: '24H' },
        { value: '1w', label: '1W' },
        { value: '1m', label: '1M' },
        { value: '3m', label: '3M' },
        { value: '6m', label: '6M' },
        { value: '1y', label: '1Y' },
        { value: 'all', label: 'All' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading coin data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
                    >
                        ← Back
                    </button>
                    <h1 className="text-4xl font-bold text-gray-800">{symbol}</h1>
                    <p className="text-gray-500 mt-1">
                        Added on {coin ? new Date(coin.createdAt).toLocaleDateString() : ''}
                    </p>
                </div>

                {/* Current Price Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Price</h2>
                    {currentPrice !== null ? (
                        <div>
                            <div className="text-4xl font-bold text-blue-600">
                                ${currentPrice.toFixed(8)}
                            </div>
                            {lastUpdated && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                            <div className="mt-3 flex items-center gap-3">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                    Live Updates
                                </div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                                    🤖 Auto-tracked
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Loading price...</p>
                    )}
                </div>

                {/* Price Chart */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3 sm:mb-0">Price History</h2>

                        {/* Time Range Selector */}
                        <div className="flex gap-2 flex-wrap">
                            {timeRanges.map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setSelectedTimeRange(range.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeRange === range.value
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-3 text-sm text-gray-600">
                        Showing {filteredHistory.length} data points
                        {selectedTimeRange !== 'all' && coin && coin.history.length > 0 && (
                            <span> (out of {coin.history.length} total)</span>
                        )}
                    </div>

                    <PriceChart history={filteredHistory} />
                </div>
            </div>
        </div>
    );
}
