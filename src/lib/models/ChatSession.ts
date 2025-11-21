import { ObjectId } from 'mongodb';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    feedback?: 'like' | 'dislike' | null; // User feedback on assistant responses
    image?: string; // Base64 encoded image for user messages
    tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCost: number;
        isEstimated?: boolean; // True if tokens were estimated, not from API
    };
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
