import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { ModalCollection, ProviderConfigCollection } from '@/src/lib/models/Modal';

/**
 * POST endpoint to recalculate totalCost for all modals based on their current token usage and pricing
 * This fixes modals that have tokens and pricing but totalCost = 0
 */
export async function POST(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();

        // Get all modals
        const modals = await db.collection(ModalCollection).find({}).toArray();

        const updates: any[] = [];
        const skipped: any[] = [];

        for (const modal of modals) {
            const inputTokensUsed = modal.inputTokensUsed || 0;
            const outputTokensUsed = modal.outputTokensUsed || 0;
            const inputPricePerMillion = modal.inputPricePerMillion || 0;
            const outputPricePerMillion = modal.outputPricePerMillion || 0;

            // Calculate the correct total cost
            const calculatedCost =
                (inputTokensUsed / 1000000) * inputPricePerMillion +
                (outputTokensUsed / 1000000) * outputPricePerMillion;

            const currentCost = modal.totalCost || 0;

            // Only update if the calculated cost is different from current
            if (Math.abs(calculatedCost - currentCost) > 0.000001) {
                // Update the modal
                await db.collection(ModalCollection).updateOne(
                    { _id: modal._id },
                    {
                        $set: {
                            totalCost: calculatedCost,
                            updatedAt: new Date()
                        }
                    }
                );

                // Also update the provider config credit
                // First, get the difference
                const costDifference = calculatedCost - currentCost;

                // Deduct the additional cost from provider credit
                await db.collection(ProviderConfigCollection).updateOne(
                    { provider: modal.provider },
                    {
                        $inc: {
                            credit: -costDifference // Deduct the difference
                        },
                        $set: { updatedAt: new Date() }
                    }
                );

                updates.push({
                    modalId: modal._id,
                    name: modal.name,
                    provider: modal.provider,
                    inputTokens: inputTokensUsed,
                    outputTokens: outputTokensUsed,
                    pricing: {
                        input: inputPricePerMillion,
                        output: outputPricePerMillion
                    },
                    oldCost: currentCost,
                    newCost: calculatedCost,
                    difference: costDifference
                });
            } else {
                skipped.push({
                    modalId: modal._id,
                    name: modal.name,
                    reason: 'Cost already correct'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Recalculated ${updates.length} modals, ${skipped.length} already correct`,
            updated: updates,
            skipped: skipped.length,
            totalCostAdjustment: updates.reduce((sum, u) => sum + u.difference, 0)
        });

    } catch (error) {
        console.error('Error recalculating costs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to recalculate costs' },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to preview what would be recalculated without making changes
 */
export async function GET(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();

        // Get all modals
        const modals = await db.collection(ModalCollection).find({}).toArray();

        const needsUpdate: any[] = [];

        for (const modal of modals) {
            const inputTokensUsed = modal.inputTokensUsed || 0;
            const outputTokensUsed = modal.outputTokensUsed || 0;
            const inputPricePerMillion = modal.inputPricePerMillion || 0;
            const outputPricePerMillion = modal.outputPricePerMillion || 0;

            // Calculate the correct total cost
            const calculatedCost =
                (inputTokensUsed / 1000000) * inputPricePerMillion +
                (outputTokensUsed / 1000000) * outputPricePerMillion;

            const currentCost = modal.totalCost || 0;

            // Check if update is needed
            if (Math.abs(calculatedCost - currentCost) > 0.000001) {
                needsUpdate.push({
                    modalId: modal._id,
                    name: modal.name,
                    provider: modal.provider,
                    inputTokens: inputTokensUsed,
                    outputTokens: outputTokensUsed,
                    pricing: `$${inputPricePerMillion}/$${outputPricePerMillion} per 1M`,
                    currentCost: currentCost,
                    shouldBeCost: calculatedCost,
                    difference: calculatedCost - currentCost
                });
            }
        }

        return NextResponse.json({
            success: true,
            needsUpdate: needsUpdate.length,
            details: needsUpdate,
            totalAdjustment: needsUpdate.reduce((sum, item) => sum + item.difference, 0)
        });

    } catch (error) {
        console.error('Error previewing recalculation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to preview recalculation' },
            { status: 500 }
        );
    }
}
