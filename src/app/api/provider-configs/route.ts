import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { ProviderConfig, ProviderConfigCollection } from '@/src/lib/models/Modal';
import { ObjectId } from 'mongodb';

// GET all provider configs (WITHOUT exposing API keys)
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const configs = await db.collection<ProviderConfig>(ProviderConfigCollection).find({}).toArray();

        // SECURITY: Remove API keys from response - only send metadata
        const safeConfigs = configs.map(config => ({
            _id: config._id,
            provider: config.provider,
            credit: config.credit,
            totalTokensUsed: config.totalTokensUsed,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            // api_key is intentionally excluded for security
        }));

        return NextResponse.json({ success: true, configs: safeConfigs });
    } catch (error) {
        console.error('Error fetching provider configs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch provider configs' },
            { status: 500 }
        );
    }
}

// POST - Create or update a provider config
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, api_key, credit } = body;

        if (!provider || !api_key) {
            return NextResponse.json(
                { success: false, error: 'Provider and API key are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Check if provider config already exists
        const existing = await db.collection<ProviderConfig>(ProviderConfigCollection)
            .findOne({ provider });

        if (existing) {
            // Update existing
            await db.collection<ProviderConfig>(ProviderConfigCollection).updateOne(
                { provider },
                {
                    $set: {
                        api_key,
                        credit: credit || existing.credit || 0,
                        updatedAt: new Date(),
                    }
                }
            );

            return NextResponse.json({
                success: true,
                config: { ...existing, api_key, credit: credit || existing.credit || 0 },
            });
        } else {
            // Create new
            const newConfig: ProviderConfig = {
                provider,
                api_key,
                credit: credit || 0,
                totalTokensUsed: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection<ProviderConfig>(ProviderConfigCollection)
                .insertOne(newConfig);

            return NextResponse.json({
                success: true,
                config: { ...newConfig, _id: result.insertedId },
            });
        }
    } catch (error) {
        console.error('Error saving provider config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save provider config' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a provider config
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider name is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const result = await db.collection<ProviderConfig>(ProviderConfigCollection)
            .deleteOne({ provider: provider as any });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Provider config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting provider config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete provider config' },
            { status: 500 }
        );
    }
}

// PATCH - Update provider credit or other fields
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, credit, ...updates } = body;

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider name is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const updateFields: any = { ...updates, updatedAt: new Date() };
        if (credit !== undefined) {
            updateFields.credit = credit;
        }

        const result = await db.collection<ProviderConfig>(ProviderConfigCollection)
            .updateOne(
                { provider: provider as any },
                { $set: updateFields }
            );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Provider config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating provider config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update provider config' },
            { status: 500 }
        );
    }
}
