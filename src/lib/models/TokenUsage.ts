import { ObjectId } from 'mongodb';

// Token usage log - permanent record of all AI interactions
export interface TokenUsageLog {
    _id?: ObjectId;
    userId: string; // Email or user identifier
    modalId: string; // Which AI model was used
    modalName: string; // Model name for easier querying
    provider: string; // Provider name (OpenAI, Anthropic, etc.)
    sessionId?: string; // Chat session ID (nullable since sessions can be deleted)

    // Token usage
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;

    // Cost calculation
    inputCost: number;
    outputCost: number;
    totalCost: number;

    // Metadata
    isEstimated: boolean; // True if tokens were estimated, not from API
    promptLength: number; // Character count of user input
    responseLength: number; // Character count of AI response
    hadImage: boolean; // Whether the request included an image

    // Timestamps
    createdAt: Date;
}

export const TokenUsageLogCollection = 'tokenUsageLogs';
