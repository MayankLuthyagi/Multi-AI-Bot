import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Modal, ModalCollection, ProviderConfig, ProviderConfigCollection } from '@/src/lib/models/Modal';
import { calculateConversationTokens, calculateCost } from '@/src/lib/tokenCounter';
import { getSession } from '@/src/lib/session';
import { ObjectId } from 'mongodb';

// Web search tool definition for providers without native search
const WEB_SEARCH_TOOL = {
    type: "function",
    function: {
        name: "web_search",
        description: "Search the web for current information, news, facts, or any real-time data. Use this when you need up-to-date information or when the user asks about current events, latest news, or real-world facts.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to look up on the web"
                }
            },
            required: ["query"]
        }
    }
};

// Anthropic-specific tool format (no function wrapper)
const ANTHROPIC_WEB_SEARCH_TOOL = {
    name: "web_search",
    description: "Search the web for current information, news, facts, or any real-time data. Use this when you need up-to-date information or when the user asks about current events, latest news, or real-world facts.",
    input_schema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The search query to look up on the web"
            }
        },
        required: ["query"]
    }
};

// Perform web search using Tavily API (fallback to DuckDuckGo if no API key)
async function performWebSearch(query: string): Promise<string> {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    try {
        if (TAVILY_API_KEY) {
            // Use Tavily API
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: TAVILY_API_KEY,
                    query: query,
                    max_results: 5,
                    include_answer: true,
                    include_raw_content: false
                })
            });

            if (!response.ok) {
                throw new Error(`Tavily API error: ${response.status}`);
            }

            const data = await response.json();

            // Format results
            let searchResults = '';
            if (data.answer) {
                searchResults += `Summary: ${data.answer}\n\n`;
            }
            if (data.results && data.results.length > 0) {
                searchResults += 'Sources:\n';
                data.results.forEach((result: any, index: number) => {
                    searchResults += `${index + 1}. ${result.title}\n`;
                    searchResults += `  URL: ${result.url}\n`;
                    searchResults += `  ${result.content}\n\n`;
                });
            }
            return searchResults || 'No results found.';

        } else {
            // Fallback: Simple DuckDuckGo instant answer API
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
            const data = await response.json();

            let results = '';
            if (data.AbstractText) {
                results += `${data.AbstractText}\n`;
            }
            if (data.AbstractURL) {
                results += `Source: ${data.AbstractURL}\n`;
            }

            // Add related topics if available
            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                results += '\nRelated information:\n';
                data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
                    if (topic.Text) {
                        results += `- ${topic.Text}\n`;
                    }
                });
            }

            return results || `Searched for: "${query}" but no detailed results available. Consider installing Tavily API key for better search results.`;
        }
    } catch (error) {
        console.error('Web search error:', error);
        return `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

// Helper function to extract response using path notation
function getNestedValue(obj: any, path: string): string {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return '';
        }
    }
    return typeof result === 'string' ? result : JSON.stringify(result);
}

// Build request body based on provider
function buildRequestBody(provider: string, modelId: string, message: string, conversationHistory?: Array<{ role: string, content: string }>, image?: string, webSearchEnabled?: boolean): any {
    const baseParams = {
        temperature: 0.7,
        max_tokens: 1000,
    };

    // Prepare messages array with conversation history
    let messages = conversationHistory && conversationHistory.length > 0
        ? [...conversationHistory]
        : [];

    // Add current message (only if it's not empty, i.e., not a tool result follow-up)
    if (message || image) {
        if (image) {
            // Handle vision-capable models with image
            const imageMessage: any = {
                role: 'user',
                content: [
                    { type: 'text', text: message },
                    {
                        type: 'image_url',
                        image_url: {
                            url: image // Base64 data URL
                        }
                    }
                ]
            };
            messages.push(imageMessage);
        } else {
            // Regular text message
            messages.push({ role: 'user', content: message });
        }
    }


    // Providers that need custom web_search tool
    const needsWebSearchTool = !['OpenAI', 'Google', 'Perplexity AI', 'Zhipu AI'].includes(provider);

    switch (provider) {
        case 'OpenAI':
        case 'DeepSeek':
        case 'xAI':
        case 'Perplexity AI':
        case 'Mistral AI':
        case 'Moonshot AI':
            const openaiBody: any = {
                model: modelId,
                messages: messages,
                ...baseParams,
            };

            if (provider === 'OpenAI' && webSearchEnabled) {
                // Convert modelId → with-search model
                if (!modelId.includes('-with-search')) {
                    openaiBody.model = `${modelId}-with-search`;
                }
            }

            // Add web_search tool for DeepSeek, xAI, Mistral AI, and Moonshot AI
            if ((provider === 'DeepSeek' || provider === 'xAI' || provider === 'Mistral AI' || provider === 'Moonshot AI') && webSearchEnabled) {
                openaiBody.tools = [WEB_SEARCH_TOOL];
            }

            return openaiBody;

        case 'Zhipu AI':
            const zhipuBody: any = {
                model: modelId,
                messages: messages,
                ...baseParams,
            };

            if (webSearchEnabled) {
                zhipuBody.tools = [
                    {
                        type: "web_search",
                        web_search: {}
                    }
                ];
            }

            return zhipuBody;


        case 'Anthropic':
            // Anthropic vision format is slightly different and needs to be handled inline
            // We rely on the `messages` array being correctly prepared *before* this function call 
            // if it includes vision data in the conversationHistory. 
            // For the current request (image/message), the logic below handles the formatting.
            if (image) {
                const matches = image.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const mediaType = matches[1];
                    const base64Data = matches[2];

                    const visionMessage: any = {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: base64Data
                                }
                            },
                            { type: 'text', text: message }
                        ]
                    };

                    // Reconstruct messages array (this overwrites the push at line 147 if an image is present)
                    // Note: In the tool-call retry case, `message` is empty and `image` is undefined, 
                    // so this block is skipped, and the pre-constructed `messages` (conversationHistory) is used.
                    messages = conversationHistory && conversationHistory.length > 0
                        ? [...conversationHistory, visionMessage]
                        : [visionMessage];
                }
            }


            const anthropicBody: any = {
                model: modelId,
                messages: messages,
                max_tokens: 1000,
            };

            // Add web_search tool for Anthropic (uses different format)
            if (webSearchEnabled) {
                anthropicBody.tools = [ANTHROPIC_WEB_SEARCH_TOOL];
            }

            return anthropicBody;

        case 'Google':
            // Google uses a different format - convert messages to contents
            let contents = conversationHistory && conversationHistory.length > 0
                ? conversationHistory.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    // Handle complex content like image/tool results if they exist in history (simplified here for text only)
                    parts: Array.isArray(msg.content) ? msg.content : [{ text: msg.content }]
                }))
                : [];

            // Add current message with image if present
            if (message || image) {
                let parts: any[] = [];
                if (image) {
                    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
                    if (matches) {
                        const mimeType = matches[1];
                        const base64Data = matches[2];
                        parts.push(
                            { text: message },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            } as any
                        );
                    }
                } else {
                    parts.push({ text: message });
                }

                // Only push the current turn if it has content (message or image)
                if (parts.length > 0) {
                    contents.push({ role: 'user', parts: parts });
                }
            }

            const googleBody: any = {
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            };

            // Add web search for Google if enabled
            if (webSearchEnabled) {
                googleBody.tools = [{ google_search: {} }];
                googleBody.generationConfig = {
                    ...googleBody.generationConfig,
                    enable_grounding: true,
                };
            }

            return googleBody;

        default:
            const defaultBody: any = {
                messages: messages,
                ...baseParams,
            };

            // Add web_search tool for other providers if enabled
            if (webSearchEnabled && needsWebSearchTool) {
                defaultBody.tools = [WEB_SEARCH_TOOL];
            }

            return defaultBody;
    }
}

export async function POST(request: NextRequest) {
    let inputTokens = 0;
    let outputTokens = 0;

    try {
        const body = await request.json();
        const { modalId, message, image, apiEndpoint, apiKey, provider, modelId, headers, responsePath, conversationHistory, sessionId, webSearchEnabled } = body;

        if (!modalId || !message || !apiEndpoint) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user info from session
        const session = await getSession();
        const userId = session?.email || 'anonymous';

        // Build custom headers with API key replacement
        let requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (headers) {
            // Replace {{API_KEY}} placeholder with actual API key
            Object.entries(headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    requestHeaders[key] = value.replace('{{API_KEY}}', apiKey || '');
                }
            });
        } else {
            // Default Authorization header
            requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        // For Google API, append API key to endpoint
        let finalEndpoint = apiEndpoint;
        if (provider === 'Google' && apiKey) {
            const separator = apiEndpoint.includes('?') ? '&' : '?';
            finalEndpoint = `${apiEndpoint}${separator}key=${apiKey}`;
            // Replace {{MODEL_ID}} placeholder if present
            finalEndpoint = finalEndpoint.replace('{{MODEL_ID}}', modelId);
        }

        // Build request body based on provider with conversation history and image (FIRST REQUEST)
        const requestBody = buildRequestBody(provider || 'OpenAI', modelId, message, conversationHistory, image, webSearchEnabled);

        // Make request to the AI modal's API
        try {
            const response = await fetch(finalEndpoint, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error for modal ${modalId}:`, errorText);
                return NextResponse.json(
                    {
                        success: false,
                        error: `AI API returned error: ${response.status} - ${errorText.substring(0, 200)}`
                    },
                    { status: 500 }
                );
            }

            const data = await response.json();

            // Check if the response contains a tool call (web_search)
            let toolCalls: any[] = [];
            let finalResponseData = data; // Track the final response data

            // OpenAI/DeepSeek/xAI format
            if (data.choices && data.choices[0]?.message?.tool_calls) {
                toolCalls = data.choices[0].message.tool_calls;
            }
            // Anthropic format
            else if (data.content && Array.isArray(data.content)) {
                const toolUseBlocks = data.content.filter((block: any) => block.type === 'tool_use');
                if (toolUseBlocks.length > 0) {
                    toolCalls = toolUseBlocks.map((block: any) => ({
                        id: block.id,
                        type: 'function',
                        function: {
                            name: block.name,
                            arguments: JSON.stringify(block.input)
                        }
                    }));
                }
            }

            // Handle token usage from first request (used as initial base)
            if (data.usage) {
                inputTokens += data.usage.prompt_tokens || data.usage.input_tokens || 0;
                outputTokens += data.usage.completion_tokens || data.usage.output_tokens || 0;
            } else if (data.usageMetadata) {
                inputTokens += data.usageMetadata.promptTokenCount || 0;
                outputTokens += data.usageMetadata.candidatesTokenCount || 0;
            }

            // Handle tool calls (web search)
            if (toolCalls.length > 0 && webSearchEnabled) {
                console.log('🔍 Tool calls detected:', toolCalls);

                // Execute all tool calls
                const toolResults: any[] = [];
                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function?.name || toolCall.name;

                    if (functionName === 'web_search') {
                        let args;
                        try {
                            // Extract arguments for different tool call formats
                            args = typeof toolCall.function?.arguments === 'string'
                                ? JSON.parse(toolCall.function.arguments)
                                : toolCall.input || toolCall.function?.arguments;
                        } catch (e) {
                            console.warn('Could not parse tool arguments, assuming raw query:', toolCall.function?.arguments);
                            args = { query: toolCall.function?.arguments };
                        }

                        const searchQuery = args.query || args.q || '';
                        console.log(`🔍 Executing web search: "${searchQuery}"`);

                        const searchResults = await performWebSearch(searchQuery);

                        toolResults.push({
                            tool_call_id: toolCall.id,
                            role: 'tool',
                            name: 'web_search',
                            content: searchResults
                        });
                    }
                }

                // Send tool results back to the model (SECOND REQUEST)
                if (toolResults.length > 0) {

                    // 1. Build the full message history including the user's latest prompt
                    let allMessagesForSecondCall: Array<any> = [...(conversationHistory || [])];

                    // Re-add the current user turn (including image if present) to the history
                    const userMessageForSecondCall: any = image
                        ? buildRequestBody(provider || 'OpenAI', modelId, message, undefined, image, webSearchEnabled).messages[0]
                        : { role: 'user', content: message };

                    allMessagesForSecondCall.push(userMessageForSecondCall);

                    // 2. Add assistant's tool call response
                    if (provider === 'Anthropic') {
                        // Anthropic format: Assistant message with tool_use blocks in content array
                        // Build content array from the original response
                        let assistantContent: any[] = [];

                        // Include any text blocks from the original response
                        if (data.content && Array.isArray(data.content)) {
                            const textBlocks = data.content.filter((block: any) => block.type === 'text');
                            assistantContent.push(...textBlocks);
                        }

                        // Add tool_use blocks
                        const toolUseBlocks = data.content.filter((block: any) => block.type === 'tool_use');
                        assistantContent.push(...toolUseBlocks);

                        allMessagesForSecondCall.push({
                            role: 'assistant',
                            content: assistantContent
                        } as any);

                        // Add tool results in Anthropic format (user message with tool_result blocks)
                        allMessagesForSecondCall.push({
                            role: 'user',
                            content: toolResults.map(tr => ({
                                type: 'tool_result',
                                tool_use_id: tr.tool_call_id,
                                content: tr.content
                            }))
                        } as any);
                    } else {
                        // OpenAI/DeepSeek/xAI format: Assistant message with tool_calls and null content
                        allMessagesForSecondCall.push({
                            role: 'assistant',
                            content: null,
                            tool_calls: toolCalls
                        } as any);

                        // Add tool results in OpenAI format
                        toolResults.forEach(tr => {
                            allMessagesForSecondCall.push(tr as any);
                        });
                    }

                    // 3. Make second request with the fully prepared message array
                    const secondRequestBody = buildRequestBody(
                        provider || 'OpenAI',
                        modelId,
                        '', // No new user message in this step
                        allMessagesForSecondCall, // Pass the full history/turn context
                        undefined, // Image already included in allMessagesForSecondCall
                        webSearchEnabled
                    );

                    console.log('🔄 Sending tool results back to model...');

                    const secondResponse = await fetch(finalEndpoint, {
                        method: 'POST',
                        headers: requestHeaders,
                        body: JSON.stringify(secondRequestBody),
                    });

                    if (!secondResponse.ok) {
                        const errorText = await secondResponse.text();
                        console.error(`API Error on second request:`, errorText);
                        return NextResponse.json(
                            {
                                success: false,
                                error: `AI API returned error on tool result: ${secondResponse.status}`
                            },
                            { status: 500 }
                        );
                    }

                    const secondData = await secondResponse.json();

                    // Update finalResponseData to use the second response
                    finalResponseData = secondData;

                    // Update token usage from second request
                    if (secondData.usage) {
                        inputTokens += secondData.usage.prompt_tokens || secondData.usage.input_tokens || 0;
                        outputTokens += secondData.usage.completion_tokens || secondData.usage.output_tokens || 0;
                    } else if (secondData.usageMetadata) {
                        inputTokens += secondData.usageMetadata.promptTokenCount || 0;
                        outputTokens += secondData.usageMetadata.candidatesTokenCount || 0;
                    }
                }
            }

            // If tool call didn't happen or after second tool call completion
            // If the first request didn't use native token tracking and there was no tool call, estimate tokens here
            let usedEstimation = false;
            if (inputTokens === 0 && outputTokens === 0) {
                // Fallback: Estimate tokens if API doesn't provide them and no tool call occurred
                let fullInputText = message;
                if (conversationHistory && conversationHistory.length > 0) {
                    fullInputText = conversationHistory.map((msg: { role: string, content: string }) => msg.content).join('\n') + '\n' + message;
                }

                let aiResponse = '';
                // Attempt to extract response for token estimation, if not already extracted in tool block
                if (responsePath) {
                    aiResponse = getNestedValue(data, responsePath);
                }
                if (!aiResponse) {
                    // Fallback extraction
                    if (data.choices && data.choices[0]?.message?.content) {
                        aiResponse = data.choices[0].message.content;
                    } else if (data.content && data.content[0]?.text) {
                        aiResponse = data.content[0].text;
                    } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                        aiResponse = data.candidates[0].content.parts[0].text;
                    }
                }

                if (aiResponse) {
                    const tokenEstimates = calculateConversationTokens(fullInputText, aiResponse, []);
                    inputTokens = tokenEstimates.inputTokens;
                    outputTokens = tokenEstimates.outputTokens;
                    usedEstimation = true;
                    console.log(`⚠️ API didn't provide token counts for ${provider}. Using estimation: input=${inputTokens}, output=${outputTokens}`);
                }
            }


            // Extract final response from finalResponseData (which is either the first response or the second response after tool call)
            let aiResponse = '';
            if (responsePath) {
                aiResponse = getNestedValue(finalResponseData, responsePath);
            }

            // Fallback to common formats
            if (!aiResponse) {
                if (finalResponseData.choices && finalResponseData.choices[0]?.message?.content) {
                    aiResponse = finalResponseData.choices[0].message.content;
                } else if (finalResponseData.content && Array.isArray(finalResponseData.content)) {
                    const textBlock = finalResponseData.content.find((block: any) => block.type === 'text');
                    aiResponse = textBlock?.text || '';
                    if (!aiResponse && finalResponseData.content[0]?.text) {
                        aiResponse = finalResponseData.content[0].text;
                    }
                } else if (finalResponseData.candidates && finalResponseData.candidates[0]?.content?.parts?.[0]?.text) {
                    aiResponse = finalResponseData.candidates[0].content.parts[0].text;
                } else if (finalResponseData.response) {
                    aiResponse = finalResponseData.response;
                } else if (finalResponseData.message) {
                    aiResponse = finalResponseData.message;
                }

                if (!aiResponse) {
                    aiResponse = 'Received response but could not parse it: ' + JSON.stringify(finalResponseData).substring(0, 200);
                }
            }

            // Update modal token usage and cost in database
            try {
                const { db } = await connectToDatabase();
                const { TokenUsageLogCollection } = await import('@/src/lib/models/TokenUsage');

                // Get the modal to calculate cost
                const modal = await db.collection(ModalCollection).findOne({ _id: new ObjectId(modalId) });

                if (modal && (inputTokens > 0 || outputTokens > 0)) {
                    // Calculate cost: (totalTokens / 1M) * pricePerMillion
                    const inputCost = (inputTokens / 1000000) * (modal.inputPricePerMillion || 0);
                    const outputCost = (outputTokens / 1000000) * (modal.outputPricePerMillion || 0);
                    const totalCost = inputCost + outputCost;

                    console.log(`💰 Token usage for ${modal.name}: Input=${inputTokens}, Output=${outputTokens}, Cost=$${totalCost.toFixed(6)}`);

                    // 1. Save to permanent token usage log
                    await db.collection(TokenUsageLogCollection).insertOne({
                        userId: userId,
                        modalId: modalId,
                        modalName: modal.name,
                        provider: modal.provider,
                        sessionId: sessionId || null, // Optional session reference
                        inputTokens: inputTokens,
                        outputTokens: outputTokens,
                        totalTokens: inputTokens + outputTokens,
                        inputCost: inputCost,
                        outputCost: outputCost,
                        totalCost: totalCost,
                        isEstimated: usedEstimation,
                        promptLength: message.length,
                        responseLength: aiResponse.length,
                        hadImage: !!image,
                        usedWebSearch: toolCalls.length > 0 && webSearchEnabled,
                        createdAt: new Date()
                    });

                    // 2. Update modal token usage and cost (aggregated totals)
                    await db.collection(ModalCollection).updateOne(
                        { _id: new ObjectId(modalId) },
                        {
                            $inc: {
                                inputTokensUsed: inputTokens,
                                outputTokensUsed: outputTokens,
                                totalCost: totalCost
                            },
                            $set: { updatedAt: new Date() }
                        }
                    );

                    // 3. Update provider total tokens and deduct credit
                    await db.collection(ProviderConfigCollection).updateOne(
                        { provider: modal.provider },
                        {
                            $inc: {
                                totalTokensUsed: inputTokens + outputTokens,
                                credit: -totalCost // Deduct cost from credits
                            },
                            $set: { updatedAt: new Date() }
                        }
                    );
                }
            } catch (trackingError) {
                console.error('Error tracking token usage:', trackingError);
                // Don't fail the request if tracking fails
            }

            const { db } = await connectToDatabase();
            const modal = await db.collection(ModalCollection).findOne({ _id: new ObjectId(modalId) });
            const inputCost = modal ? (inputTokens / 1000000) * (modal.inputPricePerMillion || 0) : 0;
            const outputCost = modal ? (outputTokens / 1000000) * (modal.outputPricePerMillion || 0) : 0;
            const totalCost = inputCost + outputCost;

            return NextResponse.json({
                success: true,
                response: aiResponse,
                modalId,
                usedWebSearch: toolCalls.length > 0 && webSearchEnabled,
                tokenUsage: inputTokens + outputTokens > 0 ? {
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                    estimatedCost: totalCost,
                    isEstimated: usedEstimation
                } : undefined
            });

        } catch (apiError: any) {
            console.error(`Error calling AI API for modal ${modalId}:`, apiError);
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to connect to AI service: ${apiError.message || 'Unknown error'}`
                },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Error in chat endpoint:', error);
        return NextResponse.json(
            { success: false, error: `Internal server error: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}