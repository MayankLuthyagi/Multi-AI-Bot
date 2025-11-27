'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddCoinPage() {
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol: symbol.toUpperCase() }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to add coin');
                setLoading(false);
                return;
            }

            // Redirect to coin details page
            router.push(`/coins/${data.coin.symbol}`);

        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    Add New Coin
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
                            Coin Symbol
                        </label>
                        <input
                            type="text"
                            id="symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder="e.g., BTCUSDT"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            Enter the coin symbol from CoinDCX (e.g., BTCUSDT, ETHUSDT)
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !symbol}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? 'Adding...' : 'Add Coin'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        ← Back
                    </button>
                </div>
            </div>
        </div>
    );
}
