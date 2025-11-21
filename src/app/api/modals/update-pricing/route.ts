import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { ModalCollection, PROVIDER_TEMPLATES } from '@/src/lib/models/Modal';
import { ObjectId } from 'mongodb';

/**
 * PATCH endpoint to update modal pricing based on provider templates
 * This is useful when you've created modals with 0 pricing and need to fix them
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { modalId, inputPricePerMillion, outputPricePerMillion } = body;

        if (!modalId) {
            return NextResponse.json(
                { success: false, error: 'Modal ID is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // If prices are provided, use them directly
        if (inputPricePerMillion !== undefined || outputPricePerMillion !== undefined) {
            const updateFields: any = { updatedAt: new Date() };

            if (inputPricePerMillion !== undefined) {
                updateFields.inputPricePerMillion = inputPricePerMillion;
            }
            if (outputPricePerMillion !== undefined) {
                updateFields.outputPricePerMillion = outputPricePerMillion;
            }

            const result = await db.collection(ModalCollection).updateOne(
                { _id: new ObjectId(modalId) },
                { $set: updateFields }
            );

            if (result.matchedCount === 0) {
                return NextResponse.json(
                    { success: false, error: 'Modal not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Pricing updated successfully',
                updated: updateFields
            });
        }

        // Otherwise, try to auto-detect pricing from provider templates
        const modal = await db.collection(ModalCollection).findOne({ _id: new ObjectId(modalId) });

        if (!modal) {
            return NextResponse.json(
                { success: false, error: 'Modal not found' },
                { status: 404 }
            );
        }

        // Find provider template
        const providerTemplate = PROVIDER_TEMPLATES.find(t => t.name === modal.provider);

        if (!providerTemplate) {
            return NextResponse.json(
                { success: false, error: 'Provider template not found' },
                { status: 404 }
            );
        }

        // Find matching model in template
        const modelTemplate = providerTemplate.availableModels.find(m => m.id === modal.modelId);

        if (!modelTemplate) {
            return NextResponse.json(
                { success: false, error: 'Model not found in provider template. Please provide pricing manually.' },
                { status: 404 }
            );
        }

        // Update with template pricing
        const result = await db.collection(ModalCollection).updateOne(
            { _id: new ObjectId(modalId) },
            {
                $set: {
                    inputPricePerMillion: modelTemplate.inputPricePerMillion,
                    outputPricePerMillion: modelTemplate.outputPricePerMillion,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Pricing updated from provider template',
            pricing: {
                inputPricePerMillion: modelTemplate.inputPricePerMillion,
                outputPricePerMillion: modelTemplate.outputPricePerMillion
            }
        });

    } catch (error) {
        console.error('Error updating modal pricing:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update pricing' },
            { status: 500 }
        );
    }
}

/**
 * POST endpoint to bulk update all modals with 0 pricing
 * Also recalculates totalCost based on existing token usage
 */
export async function POST(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();

        // Find all modals with 0 pricing
        const modalsWithZeroPricing = await db.collection(ModalCollection)
            .find({
                $or: [
                    { inputPricePerMillion: 0 },
                    { outputPricePerMillion: 0 },
                    { inputPricePerMillion: { $exists: false } },
                    { outputPricePerMillion: { $exists: false } }
                ]
            })
            .toArray();

        const updates: any[] = [];
        const failures: any[] = [];

        for (const modal of modalsWithZeroPricing) {
            // Find provider template
            const providerTemplate = PROVIDER_TEMPLATES.find(t => t.name === modal.provider);

            if (!providerTemplate) {
                failures.push({
                    modalId: modal._id,
                    name: modal.name,
                    reason: 'Provider template not found'
                });
                continue;
            }

            // Find matching model in template
            const modelTemplate = providerTemplate.availableModels.find(m => m.id === modal.modelId);

            if (!modelTemplate) {
                failures.push({
                    modalId: modal._id,
                    name: modal.name,
                    modelId: modal.modelId,
                    reason: 'Model not found in provider template'
                });
                continue;
            }

            // Calculate total cost based on existing token usage
            const inputTokensUsed = modal.inputTokensUsed || 0;
            const outputTokensUsed = modal.outputTokensUsed || 0;
            const newTotalCost =
                (inputTokensUsed / 1000000) * modelTemplate.inputPricePerMillion +
                (outputTokensUsed / 1000000) * modelTemplate.outputPricePerMillion;

            // Update pricing and recalculate total cost
            await db.collection(ModalCollection).updateOne(
                { _id: modal._id },
                {
                    $set: {
                        inputPricePerMillion: modelTemplate.inputPricePerMillion,
                        outputPricePerMillion: modelTemplate.outputPricePerMillion,
                        totalCost: newTotalCost,
                        updatedAt: new Date()
                    }
                }
            );

            updates.push({
                modalId: modal._id,
                name: modal.name,
                modelId: modal.modelId,
                pricing: {
                    inputPricePerMillion: modelTemplate.inputPricePerMillion,
                    outputPricePerMillion: modelTemplate.outputPricePerMillion
                },
                recalculated: {
                    inputTokensUsed,
                    outputTokensUsed,
                    oldTotalCost: modal.totalCost || 0,
                    newTotalCost
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} modals, ${failures.length} failed`,
            updated: updates,
            failures: failures
        });

    } catch (error) {
        console.error('Error bulk updating modal pricing:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to bulk update pricing' },
            { status: 500 }
        );
    }
}
