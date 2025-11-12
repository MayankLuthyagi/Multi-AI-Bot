import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { ChatSession, ChatSessionCollection } from '@/src/lib/models/ChatSession';
import { ObjectId } from 'mongodb';
import { getSession } from '@/src/lib/session';

// GET - Fetch all sessions for current user
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { db } = await connectToDatabase();
        const sessions = await db
            .collection<ChatSession>(ChatSessionCollection)
            .find({ userId: session.email })
            .sort({ lastMessageAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, sessions });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sessions' },
            { status: 500 }
        );
    }
}

// POST - Create a new session
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();

        console.log('POST /api/chat-sessions - Session:', session);

        if (!session?.email) {
            console.error('Unauthorized: No session or email found', session);
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please log in again',
                details: !session ? 'No session' : 'No email in session'
            }, { status: 401 });
        }

        const body = await req.json();
        const { title } = body;

        const { db } = await connectToDatabase();

        // Count existing sessions to generate default title
        const count = await db
            .collection<ChatSession>(ChatSessionCollection)
            .countDocuments({ userId: session.email });

        const newSession: ChatSession = {
            userId: session.email,
            title: title || `Chat ${count + 1}`,
            createdAt: new Date(),
            lastMessageAt: new Date(),
            messages: {},
        };

        const result = await db
            .collection<ChatSession>(ChatSessionCollection)
            .insertOne(newSession);

        console.log('Session created successfully:', result.insertedId);

        return NextResponse.json({
            success: true,
            session: { ...newSession, _id: result.insertedId },
        });
    } catch (error) {
        console.error('Error creating chat session:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create session', details: String(error) },
            { status: 500 }
        );
    }
}

// PATCH - Update session (messages or title)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { _id, title, messages } = body;

        if (!_id) {
            return NextResponse.json(
                { success: false, error: 'Session ID required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const updateData: any = {
            lastMessageAt: new Date(),
        };

        if (title !== undefined) {
            updateData.title = title;
        }

        if (messages !== undefined) {
            updateData.messages = messages;
        }

        const result = await db
            .collection<ChatSession>(ChatSessionCollection)
            .updateOne(
                { _id: new ObjectId(_id), userId: session.email },
                { $set: updateData }
            );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating chat session:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a session
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const _id = searchParams.get('_id');

        if (!_id) {
            return NextResponse.json(
                { success: false, error: 'Session ID required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        const result = await db
            .collection<ChatSession>(ChatSessionCollection)
            .deleteOne({ _id: new ObjectId(_id), userId: session.email });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete session' },
            { status: 500 }
        );
    }
}
