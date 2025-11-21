import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { ModalCollection, ProviderConfigCollection } from '@/src/lib/models/Modal';

export async function GET(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();

        // Get aggregated stats for all modals
        const modals = await db.collection(ModalCollection).find({}).toArray();

        // Get provider configs with credit info
        const providers = await db.collection(ProviderConfigCollection).find({}).toArray();

        // Calculate total statistics
        const totalStats = modals.reduce(
            (acc, modal) => {
                acc.totalInputTokens += modal.inputTokensUsed || 0;
                acc.totalOutputTokens += modal.outputTokensUsed || 0;
                acc.totalCost += modal.totalCost || 0;
                return acc;
            },
            { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 }
        );

        // Group stats by provider
        const providerStats = modals.reduce((acc: any, modal) => {
            if (!acc[modal.provider]) {
                acc[modal.provider] = {
                    provider: modal.provider,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalCost: 0,
                    credit: 0,
                    models: []
                };
            }

            acc[modal.provider].inputTokens += modal.inputTokensUsed || 0;
            acc[modal.provider].outputTokens += modal.outputTokensUsed || 0;
            acc[modal.provider].totalCost += modal.totalCost || 0;

            acc[modal.provider].models.push({
                name: modal.name,
                modelId: modal.modelId,
                status: modal.status,
                inputTokens: modal.inputTokensUsed || 0,
                outputTokens: modal.outputTokensUsed || 0,
                totalTokens: (modal.inputTokensUsed || 0) + (modal.outputTokensUsed || 0),
                cost: modal.totalCost || 0,
                inputPricePerMillion: modal.inputPricePerMillion,
                outputPricePerMillion: modal.outputPricePerMillion
            });

            return acc;
        }, {});

        // Add credit info from provider configs
        providers.forEach(provider => {
            if (providerStats[provider.provider]) {
                providerStats[provider.provider].credit = provider.credit || 0;
            }
        });

        return NextResponse.json({
            success: true,
            stats: {
                overall: {
                    totalInputTokens: totalStats.totalInputTokens,
                    totalOutputTokens: totalStats.totalOutputTokens,
                    totalTokens: totalStats.totalInputTokens + totalStats.totalOutputTokens,
                    totalCost: totalStats.totalCost,
                    activeModels: modals.filter(m => m.status === 'active').length,
                    totalModels: modals.length
                },
                byProvider: Object.values(providerStats),
                recentActivity: {
                    timestamp: new Date(),
                    modelsActive: modals.filter(m => m.status === 'active').length
                }
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
