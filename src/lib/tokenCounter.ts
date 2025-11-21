/**
 * Simple token counter utility
 * Uses a rough estimation based on character count and word count
 * For more accurate counting, you could integrate tiktoken library
 */

export function estimateTokenCount(text: string): number {
    if (!text) return 0;

    // Remove extra whitespace
    const cleanedText = text.trim();

    // Count words
    const words = cleanedText.split(/\s+/).length;

    // Count characters
    const chars = cleanedText.length;

    // Estimation formula:
    // - Average English word is ~4 characters
    // - GPT models use ~1 token per 4 characters (or ~0.75 tokens per word)
    // We'll use a weighted average for better estimation

    const tokensByChars = chars / 4;
    const tokensByWords = words * 0.75;

    // Take average and round up
    const estimatedTokens = Math.ceil((tokensByChars + tokensByWords) / 2);

    return estimatedTokens;
}

/**
 * Calculate total tokens for a conversation
 */
export function calculateConversationTokens(
    inputText: string,
    outputText: string,
    conversationHistory?: Array<{ role: string; content: string }>
): { inputTokens: number; outputTokens: number; totalTokens: number } {
    // Count input tokens (current message)
    let inputTokens = estimateTokenCount(inputText);

    // Add conversation history to input tokens (context)
    if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
            inputTokens += estimateTokenCount(msg.content);
        }
    }

    // Count output tokens
    const outputTokens = estimateTokenCount(outputText);

    // Total tokens
    const totalTokens = inputTokens + outputTokens;

    return { inputTokens, outputTokens, totalTokens };
}

/**
 * Calculate cost based on tokens and cost per 1K tokens
 */
export function calculateCost(tokens: number, costPer1KTokens: number): number {
    return (tokens / 1000) * costPer1KTokens;
}
