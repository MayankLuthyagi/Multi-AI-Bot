import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { TokenUsageLogCollection } from '@/src/lib/models/TokenUsage';
import { getSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const provider = searchParams.get('provider');
        const modalId = searchParams.get('modalId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const { db } = await connectToDatabase();

        // Build query filter
        const filter: any = { userId: session.email };

        if (provider) filter.provider = provider;
        if (modalId) filter.modalId = modalId;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Get token usage logs
        const logs = await db.collection(TokenUsageLogCollection)
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        // Get aggregated statistics
        const stats = await db.collection(TokenUsageLogCollection).aggregate([
            { $match: { userId: session.email } },
            {
                $group: {
                    _id: null,
                    totalInputTokens: { $sum: '$inputTokens' },
                    totalOutputTokens: { $sum: '$outputTokens' },
                    totalTokens: { $sum: '$totalTokens' },
                    totalCost: { $sum: '$totalCost' },
                    totalRequests: { $sum: 1 },
                    estimatedRequests: {
                        $sum: { $cond: ['$isEstimated', 1, 0] }
                    }
                }
            }
        ]).toArray();

        // Group by provider
        const providerStats = await db.collection(TokenUsageLogCollection).aggregate([
            { $match: { userId: session.email } },
            {
                $group: {
                    _id: '$provider',
                    totalCost: { $sum: '$totalCost' },
                    totalTokens: { $sum: '$totalTokens' },
                    requests: { $sum: 1 }
                }
            },
            { $sort: { totalCost: -1 } }
        ]).toArray();

        // Group by model
        const modelStats = await db.collection(TokenUsageLogCollection).aggregate([
            { $match: { userId: session.email } },
            {
                $group: {
                    _id: { modalId: '$modalId', modalName: '$modalName' },
                    totalCost: { $sum: '$totalCost' },
                    totalTokens: { $sum: '$totalTokens' },
                    requests: { $sum: 1 }
                }
            },
            { $sort: { totalCost: -1 } }
        ]).toArray();

        return NextResponse.json({
            success: true,
            logs: logs,
            statistics: {
                overall: stats[0] || {
                    totalInputTokens: 0,
                    totalOutputTokens: 0,
                    totalTokens: 0,
                    totalCost: 0,
                    totalRequests: 0,
                    estimatedRequests: 0
                },
                byProvider: providerStats.map(p => ({
                    provider: p._id,
                    totalCost: p.totalCost,
                    totalTokens: p.totalTokens,
                    requests: p.requests
                })),
                byModel: modelStats.map(m => ({
                    modalId: m._id.modalId,
                    modalName: m._id.modalName,
                    totalCost: m.totalCost,
                    totalTokens: m.totalTokens,
                    requests: m.requests
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching token usage logs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch token usage logs' },
            { status: 500 }
        );
    }
}
