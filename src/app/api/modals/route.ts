import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Modal, ModalCollection } from '@/src/lib/models/Modal';
import { ObjectId } from 'mongodb';

// GET all modals
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const modals = await db.collection<Modal>(ModalCollection).find({}).toArray();

        return NextResponse.json({ success: true, modals });
    } catch (error) {
        console.error('Error fetching modals:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch modals' },
            { status: 500 }
        );
    }
}

// POST - Create a new modal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, provider, modelId, apiEndpoint, requestType, headers, responsePath, costPer1KTokens } = body;

        if (!name || !provider || !modelId || !apiEndpoint || !requestType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const newModal: Modal = {
            name,
            provider,
            modelId,
            apiEndpoint,
            requestType,
            headers: headers || {},
            responsePath: responsePath || 'choices[0].message.content',
            status: 'inactive', // Default to inactive, user enables from navbar
            costPer1KTokens: costPer1KTokens || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection<Modal>(ModalCollection).insertOne(newModal);

        return NextResponse.json({
            success: true,
            modal: { ...newModal, _id: result.insertedId },
        });
    } catch (error) {
        console.error('Error creating modal:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create modal' },
            { status: 500 }
        );
    }
}

// PATCH - Update modal status or other fields
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { _id, ...updates } = body;

        if (!_id) {
            return NextResponse.json(
                { success: false, error: 'Modal ID is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const result = await db.collection<Modal>(ModalCollection).updateOne(
            { _id: new ObjectId(_id) },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Modal not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating modal:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update modal' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a modal
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Modal ID is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const result = await db.collection<Modal>(ModalCollection).deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Modal not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting modal:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete modal' },
            { status: 500 }
        );
    }
}
