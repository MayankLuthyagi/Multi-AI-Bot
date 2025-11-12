import { ObjectId } from 'mongodb';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    feedback?: 'like' | 'dislike' | null; // User feedback on assistant responses
}

export interface ChatSession {
    _id?: ObjectId;
    userId: string; // Email or user identifier
    title: string;
    createdAt: Date;
    lastMessageAt: Date;
    messages: { [modalId: string]: Message[] }; // Messages per modal
}

export const ChatSessionCollection = 'chatSessions';
