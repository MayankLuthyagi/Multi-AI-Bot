'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface HistoryEntry {
    price: number;
    timestamp: string | Date;
}

interface PriceChartProps {
    history: HistoryEntry[];
}

export default function PriceChart({ history }: PriceChartProps) {
    // Prepare chart data
    const labels = history.map((entry) => {
        const date = new Date(entry.timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    });

    const prices = history.map((entry) => entry.price);

    const data = {
        labels,
        datasets: [
            {
                label: 'Price',
                data: prices,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4, // Smooth lines
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
            },
            title: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Price',
                },
                beginAtZero: false,
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    if (history.length === 0) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No price history available yet</p>
            </div>
        );
    }

    return (
        <div className="w-full h-96 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <Line data={data} options={options} />
        </div>
    );
}
