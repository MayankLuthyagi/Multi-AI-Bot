"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import LoginModal from "../components/LoginModal";
ChartJS.register(ArcElement, Tooltip, Legend);

interface ModelStats {
    name: string;
    modelId: string;
    status: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    inputPricePerMillion?: number;
    outputPricePerMillion?: number;
}

interface ProviderStat {
    provider: string;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    credit: number;
    models: ModelStats[];
}

interface StatsData {
    overall: {
        totalInputTokens: number;
        totalOutputTokens: number;
        totalTokens: number;
        totalCost: number;
        activeModels: number;
        totalModels: number;
    };
    byProvider: ProviderStat[];
}

export default function ProviderStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recalculating, setRecalculating] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    useEffect(() => {
        setIsMounted(true);
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch stats');
            }
        } catch (err) {
            setError('Failed to load statistics');
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const recalculateCosts = async () => {
        try {
            setRecalculating(true);
            const response = await fetch('/api/modals/recalculate-costs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.success) {
                alert(`✅ Successfully recalculated ${data.updated.length} models!\n\nTotal cost adjustment: $${data.totalCostAdjustment.toFixed(4)}`);
                // Refresh stats after recalculation
                await fetchStats();
            } else {
                alert(`❌ Failed to recalculate: ${data.error}`);
            }
        } catch (err) {
            console.error('Error recalculating costs:', err);
            alert('❌ Failed to recalculate costs');
        } finally {
            setRecalculating(false);
        }
    };

    const calculateRemainingCredit = (provider: ProviderStat) => {
        // Credit is already deducted in the backend, so just return the current credit value
        return provider.credit;
    };

    const calculateInitialCredit = (provider: ProviderStat) => {
        // Initial credit = current credit + total cost spent
        return provider.credit + provider.totalCost;
    };

    const calculateTotalCredit = () => {
        if (!stats) return 0;
        // Sum all provider credits (remaining)
        return stats.byProvider.reduce((sum, provider) => sum + provider.credit, 0);
    };

    const calculateTotalInitialCredit = () => {
        if (!stats) return 0;
        // Sum all provider initial credits (remaining + spent)
        return stats.byProvider.reduce((sum, provider) => sum + provider.credit + provider.totalCost, 0);
    };

    const calculateTotalTokens = (provider: ProviderStat) => {
        return provider.inputTokens + provider.outputTokens;
    };

    const calculateRemainingTokens = (remainingCredit: number, avgPricePerMillion: number) => {
        if (avgPricePerMillion === 0) return 0;
        return Math.floor((remainingCredit / avgPricePerMillion) * 1000000);
    };

    const calculateAvgPricePerMillion = (provider: ProviderStat) => {
        const totalTokens = provider.inputTokens + provider.outputTokens;
        if (totalTokens === 0 || provider.totalCost === 0) return 0;
        return (provider.totalCost / totalTokens) * 1000000;
    };

    const getPieChartData = () => {
        if (!stats) return null;

        // --- START: ORIGINAL PIE COLORS (NOT CHANGED) ---
        const colors = [
            'rgba(59, 130, 246, 0.8)',   // Blue
            'rgba(16, 185, 129, 0.8)',   // Green
            'rgba(245, 158, 11, 0.8)',   // Orange
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(239, 68, 68, 0.8)',    // Red
            'rgba(34, 197, 94, 0.8)',    // Lime
            'rgba(168, 85, 247, 0.8)',   // Violet
        ];

        const borderColors = [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(168, 85, 247, 1)',
        ];
        // --- END: ORIGINAL PIE COLORS (NOT CHANGED) ---

        return {
            labels: stats.byProvider.map(p => p.provider),
            datasets: [
                {
                    label: 'Total Cost',
                    data: stats.byProvider.map(p => p.totalCost),
                    backgroundColor: colors.slice(0, stats.byProvider.length),
                    borderColor: borderColors.slice(0, stats.byProvider.length),
                    borderWidth: 2,
                },
            ],
        };
    };

    const getProviderPieChartData = (provider: ProviderStat) => {
        // --- START: ORIGINAL PIE COLORS (NOT CHANGED) ---
        const modelColors = [
            "rgba(0,0,0,0.85)",
            "rgba(40, 39, 39, 0.85)",
            "rgba(120,120,120,0.85)",
            "rgba(180,180,180,0.85)",
            "rgba(220,220,220,0.85)",
            "rgba(40,40,40,0.85)",
            "rgba(90,90,90,0.85)",
            "rgba(150,150,150,0.85)",
            "rgba(200,200,200,0.85)",
            "rgba(230,230,230,0.85)",
        ];
        const borderColors = [
            "rgba(0,0,0,1)",
            "rgba(40, 39, 39, 0.85)",
            "rgba(120,120,120,1)",
            "rgba(180,180,180,1)",
            "rgba(220,220,220,1)",
            "rgba(40,40,40,1)",
            "rgba(90,90,90,1)",
            "rgba(150,150,150,1)",
            "rgba(200,200,200,1)",
            "rgba(230,230,230,1)",
        ];

        // If all costs are 0, show token distribution instead
        const totalCost = provider.models.reduce((sum, m) => sum + m.cost, 0);
        const totalTokens = provider.models.reduce((sum, m) => sum + m.totalTokens, 0);
        const useTokens = totalCost === 0;

        // If both are 0, show equal distribution
        let data;
        if (totalCost === 0 && totalTokens === 0) {
            data = provider.models.map(() => 1); // Equal slices
        } else {
            data = provider.models.map(m => useTokens ? m.totalTokens : m.cost);
        }

        return {
            labels: provider.models.map(m => m.name),
            datasets: [
                {
                    label: useTokens ? 'Models' : 'Model Cost',
                    data: data,
                    backgroundColor: modelColors.slice(0, provider.models.length),
                    borderColor: borderColors.slice(0, provider.models.length),
                    borderWidth: 2,
                },
            ],
        };
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#d1d5db',
                    font: {
                        size: 12,
                        weight: '500',
                    },
                    padding: 15,
                },
            },
            tooltip: {
                // Configured tooltip for dark theme (black background, white text)
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#4b5563',
                borderWidth: 1,
                callbacks: {
                    label: function (context: any) {
                        const provider = stats?.byProvider[context.dataIndex];
                        if (!provider) return '';

                        const cost = formatCurrency(context.parsed);
                        const percentage = ((context.parsed / stats!.overall.totalCost) * 100).toFixed(1);
                        const tokens = formatNumber(provider.inputTokens + provider.outputTokens);
                        const remaining = formatCurrency(provider.credit);

                        return [
                            `Cost: ${cost} (${percentage}%)`,
                            `Tokens: ${tokens}`,
                            `Remaining: ${remaining}`,
                            `Models: ${provider.models.length}`,
                        ];
                    },
                },
            },
        },
    };

    const getProviderPieChartOptions = (provider: ProviderStat) => {
        const totalCost = provider.models.reduce((sum, m) => sum + m.cost, 0);
        const useTokens = totalCost === 0;

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    // Configured tooltip for dark theme (black background, white text)
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4b5563',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context: any) {
                            const model = provider.models[context.dataIndex];
                            if (!model) return '';

                            const cost = formatCurrency(model.cost);
                            const tokens = formatNumber(model.totalTokens);
                            const inputTokens = formatNumber(model.inputTokens);
                            const outputTokens = formatNumber(model.outputTokens);

                            if (useTokens) {
                                const totalTokens = provider.models.reduce((sum, m) => sum + m.totalTokens, 0);
                                const percentage = totalTokens > 0 ? ((model.totalTokens / totalTokens) * 100).toFixed(1) : '0.0';
                                return [
                                    `Total Tokens: ${tokens} (${percentage}%)`,
                                    `Input: ${inputTokens}`,
                                    `Output: ${outputTokens}`,
                                    `Status: ${model.status}`,
                                    model.inputPricePerMillion !== undefined
                                        ? `Pricing: $${model.inputPricePerMillion}/$${model.outputPricePerMillion} per 1M`
                                        : '',
                                ].filter(Boolean);
                            } else {
                                const percentage = ((model.cost / provider.totalCost) * 100).toFixed(1);
                                return [
                                    `Cost: ${cost} (${percentage}%)`,
                                    `Total Tokens: ${tokens}`,
                                    `Input: ${inputTokens}`,
                                    `Output: ${outputTokens}`,
                                    `Status: ${model.status}`,
                                    model.inputPricePerMillion !== undefined
                                        ? `Pricing: $${model.inputPricePerMillion}/$${model.outputPricePerMillion} per 1M`
                                        : '',
                                ].filter(Boolean);
                            }
                        },
                    },
                },
            },
        };
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(Math.round(num));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        }).format(amount);
    };

    if (loading) {
        return (
            // Dark theme loader
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            // Dark theme error box
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchStats}
                    // Dark theme retry button
                    className="mt-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats || stats.byProvider.length === 0) {
        return (
            // Dark theme no data box
            <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400">No provider statistics available yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                    Configure providers and start chatting to see statistics.
                </p>
            </div>
        );
    }

    const pieData = getPieChartData();
    return (
        <div className="space-y-6">
                        {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            {/* Overall Statistics #131111 */}
            <div className="bg-[#38343a] rounded-xl p-8 border border-gray-700 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="bg-[#131111] rounded-lg p-4 border border-gray-700">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Total Tokens</p>
                        <p className="sm:text-md lg:text-2xl font-bold text-white">
                            {formatNumber(stats.overall.totalTokens)}
                        </p>
                    </div>
                    <div className="bg-[#131111] rounded-lg p-4 border border-gray-700">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Total Spent</p>
                        <p className="sm:text-md lg:text-2xl font-bold text-gray-300">
                            {formatCurrency(stats.overall.totalCost)}
                        </p>
                    </div>
                    <div className="bg-[#131111] rounded-lg p-4 border border-gray-700">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Initial Credit</p>
                        <p className="sm:text-md lg:text-2xl font-bold text-white">
                            {formatCurrency(calculateTotalInitialCredit())}
                        </p>
                    </div>
                    <div className="bg-[#131111] rounded-lg p-4 border border-gray-700">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Credit Left</p>
                        <p className="sm:text-md lg:text-2xl font-bold text-gray-200">
                            {formatCurrency(calculateTotalCredit())}
                        </p>
                    </div>
                    <div className="bg-[#131111] rounded-lg p-4 border border-gray-700">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Total Models</p>
                        <p className="sm:text-md lg:text-2xl font-bold text-white">
                            {stats.overall.totalModels}
                        </p>
                    </div>
                </div>
            </div>


            {/* Provider-wise Statistics with Pie Charts */}
            <div >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {stats.byProvider.map((provider) => {
                        const remainingCredit = calculateRemainingCredit(provider);
                        const initialCredit = calculateInitialCredit(provider);
                        const totalTokens = calculateTotalTokens(provider);
                        const avgPricePerMillion = calculateAvgPricePerMillion(provider);
                        const remainingTokens = calculateRemainingTokens(remainingCredit, avgPricePerMillion);
                        const creditPercentage = initialCredit > 0
                            ? ((remainingCredit / initialCredit) * 100)
                            : 0;
                        const providerPieData = getProviderPieChartData(provider);

                        return (
                            <div
                                key={provider.provider}
                                className="bg-[#38343a] rounded-xl shadow-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
                            >
                                {/* Provider Header */}
                                <div className="flex items-center justify-center mb-6">
                                    <h4 className="text-xl font-bold text-white tracking-tight">
                                        {provider.provider}
                                    </h4>
                                </div>
                                {/* Pie Chart */}
                                {isMounted && provider.models.length > 0 && (
                                    <div className="w-full h-64 mb-4 relative">
                                        {/* Chart colors are explicitly NOT changed */}
                                        <Pie data={providerPieData} options={getProviderPieChartOptions(provider)} />
                                    </div>
                                )}


                                {/* Credit Progress Bar */}
                                <div className="mb-4 bg-[#131111] rounded-lg p-4 border border-gray-700/50">
                                    <div className="flex justify-between text-xs font-medium text-gray-300 mb-2">
                                        <span className="uppercase tracking-wider">Credit Usage</span>
                                        <span className="text-gray-400">
                                            {creditPercentage.toFixed(1)}% remaining
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${creditPercentage > 50
                                                ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                                                : creditPercentage > 20
                                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                                }`}
                                            style={{ width: `${Math.max(0, Math.min(100, creditPercentage))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center items-center gap-4 mt-8">

                <button
                    onClick={recalculateCosts}
                    disabled={recalculating}
                    className="h-10 px-4 sm:h-12 sm:px-8 bg-[#131111] text-white font-medium rounded-lg 
                            transition-all duration-300 shadow-lg border border-gray-600 
                            hover:shadow-xl hover:bg-[#1b191d] flex items-center gap-3
                            disabled:opacity-50 cursor-pointer justify-center"
                >
                    {recalculating ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Recalculating...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                            <span>Recalculate</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="h-10 px-4 sm:h-12 sm:px-8 bg-[#131111] text-white font-medium rounded-lg 
                            transition-all duration-300 shadow-lg border border-gray-600 
                            hover:shadow-xl hover:bg-[#1b191d] flex items-center justify-center gap-3 cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 11c.828 0 1.5.672 1.5 1.5v3a1.5 1.5 0 01-3 0v-3c0-.828.672-1.5 1.5-1.5zm6-2V7a6 6 0 10-12 0v2m12 0H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                        />
                    </svg>

                    <span>Login</span>
                </button>
            </div>
        </div>
    );
}