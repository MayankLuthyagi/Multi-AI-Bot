import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Modal, ModalCollection, PROVIDER_TEMPLATES } from '@/src/lib/models/Modal';

// POST - Sync models for a provider (delete old, add new from template)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider } = body;

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider name is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Find the provider template
        const providerTemplate = PROVIDER_TEMPLATES.find(p => p.name === provider);
        if (!providerTemplate) {
            return NextResponse.json(
                { success: false, error: 'Provider template not found' },
                { status: 404 }
            );
        }

        // Get status of existing models before deleting (to preserve activation state)
        const existingModals = await db.collection<Modal>(ModalCollection)
            .find({ provider })
            .toArray();

        const activeModelIds = new Set(
            existingModals
                .filter(m => m.status === 'active')
                .map(m => m.modelId)
        );

        // Delete all existing models for this provider
        await db.collection<Modal>(ModalCollection).deleteMany({ provider });

        // Create new models from template
        const newModals = providerTemplate.availableModels.map(model => {
            const status = activeModelIds.has(model.id) ? 'active' : 'inactive';
            return {
                name: model.name,
                provider: providerTemplate.name,
                modelId: model.id,
                apiEndpoint: providerTemplate.defaultEndpoint,
                requestType: providerTemplate.defaultRequestType,
                headers: providerTemplate.headerTemplate,
                responsePath: providerTemplate.defaultResponsePath,
                status: status as 'active' | 'inactive',
                costPer1KTokens: model.costPer1KTokens,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });

        await db.collection<Modal>(ModalCollection).insertMany(newModals);

        return NextResponse.json({
            success: true,
            message: `Synced ${newModals.length} models for ${provider}`,
            count: newModals.length
        });
    } catch (error) {
        console.error('Error syncing models:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync models' },
            { status: 500 }
        );
    }
}
