import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Modal, ModalCollection, ProviderConfig, ProviderConfigCollection } from '@/src/lib/models/Modal';
import { calculateConversationTokens, calculateCost } from '@/src/lib/tokenCounter';
import { getSession } from '@/src/lib/session';
import { ObjectId } from 'mongodb';

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
function buildRequestBody(provider: string, modelId: string, message: string, conversationHistory?: Array<{ role: string, content: string }>, image?: string): any {
    const baseParams = {
        temperature: 0.7,
        max_tokens: 1000,
    };

    // Prepare messages array with conversation history
    let messages = conversationHistory && conversationHistory.length > 0
        ? [...conversationHistory]
        : [];

    // Add current message with image support
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

    switch (provider) {
        case 'OpenAI':
        case 'DeepSeek':
        case 'xAI':
        case 'Perplexity AI':
            return {
                model: modelId,
                messages: messages,
                ...baseParams,
            };

        case 'Anthropic':
            // Anthropic vision format
            if (image) {
                // Extract base64 data and media type from data URL
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

                    const anthropicMessages = conversationHistory && conversationHistory.length > 0
                        ? [...conversationHistory, visionMessage]
                        : [visionMessage];

                    return {
                        model: modelId,
                        messages: anthropicMessages,
                        max_tokens: 1000,
                    };
                }
            }
            return {
                model: modelId,
                messages: messages,
                max_tokens: 1000,
            };

        case 'Google':
            // Google uses a different format - convert messages to contents
            let contents = conversationHistory && conversationHistory.length > 0
                ? conversationHistory.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }))
                : [];

            // Add current message with image if present
            if (image) {
                // Extract base64 data from data URL
                const matches = image.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];

                    contents.push({
                        role: 'user',
                        parts: [
                            { text: message },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            } as any
                        ]
                    });
                }
            } else {
                contents.push({ role: 'user', parts: [{ text: message }] });
            }

            return {
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            };

        default:
            return {
                messages: messages,
                ...baseParams,
            };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { modalId, message, image, apiEndpoint, apiKey, provider, modelId, headers, responsePath, conversationHistory, sessionId } = body;

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

        // Build request body based on provider with conversation history and image
        const requestBody = buildRequestBody(provider || 'OpenAI', modelId, message, conversationHistory, image);

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

            // Extract response using custom path or fallback to defaults
            let aiResponse = '';

            if (responsePath) {
                aiResponse = getNestedValue(data, responsePath);
            }

            // Fallback to common formats
            if (!aiResponse) {
                // OpenAI format
                if (data.choices && data.choices[0]?.message?.content) {
                    aiResponse = data.choices[0].message.content;
                }
                // Anthropic format
                else if (data.content && data.content[0]?.text) {
                    aiResponse = data.content[0].text;
                }
                // Google format
                else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    aiResponse = data.candidates[0].content.parts[0].text;
                }
                // Generic format
                else if (data.response) {
                    aiResponse = data.response;
                }
                // Fallback
                else if (data.message) {
                    aiResponse = data.message;
                }
                else {
                    aiResponse = 'Received response but could not parse it: ' + JSON.stringify(data).substring(0, 200);
                }
            }

            // Preserve formatting - don't strip newlines or special characters

            // Extract token usage from provider response
            let inputTokens = 0;
            let outputTokens = 0;
            let usedEstimation = false;

            // OpenAI/DeepSeek/xAI/Perplexity format
            if (data.usage && (data.usage.prompt_tokens || data.usage.input_tokens)) {
                inputTokens = data.usage.prompt_tokens || data.usage.input_tokens || 0;
                outputTokens = data.usage.completion_tokens || data.usage.output_tokens || 0;
            }
            // Google format
            else if (data.usageMetadata) {
                inputTokens = data.usageMetadata.promptTokenCount || 0;
                outputTokens = data.usageMetadata.candidatesTokenCount || 0;
            }
            // Fallback: Estimate tokens if API doesn't provide them
            else {
                // Build full conversation context for accurate estimation
                let fullInputText = message;
                if (conversationHistory && conversationHistory.length > 0) {
                    fullInputText = conversationHistory.map((msg: { role: string, content: string }) => msg.content).join('\n') + '\n' + message;
                }

                const tokenEstimates = calculateConversationTokens(fullInputText, aiResponse, []);
                inputTokens = tokenEstimates.inputTokens;
                outputTokens = tokenEstimates.outputTokens;
                usedEstimation = true;
                console.log(`⚠️ API didn't provide token counts for ${provider}. Using estimation: input=${inputTokens}, output=${outputTokens}`);
            }

            // Update modal token usage and cost in database
            try {
                const { db } = await connectToDatabase();
                const { TokenUsageLogCollection } = await import('@/src/lib/models/TokenUsage');

                // Get the modal to calculate cost
                const modal = await db.collection(ModalCollection).findOne({ _id: new ObjectId(modalId) });

                if (modal && inputTokens > 0 && outputTokens > 0) {
                    // Calculate cost: (inputTokens / 1M) * inputPrice + (outputTokens / 1M) * outputPrice
                    const inputCost = (inputTokens / 1000000) * (modal.inputPricePerMillion || 0);
                    const outputCost = (outputTokens / 1000000) * (modal.outputPricePerMillion || 0);
                    const totalCost = inputCost + outputCost;

                    console.log(`💰 Token usage for ${modal.name}: Input=${inputTokens}, Output=${outputTokens}, Cost=$${totalCost.toFixed(6)}`);

                    // 1. Save to permanent token usage log (survives chat deletion)
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

            // Calculate cost for response
            const { db } = await connectToDatabase();
            const modal = await db.collection(ModalCollection).findOne({ _id: new ObjectId(modalId) });
            const inputCost = modal ? (inputTokens / 1000000) * (modal.inputPricePerMillion || 0) : 0;
            const outputCost = modal ? (outputTokens / 1000000) * (modal.outputPricePerMillion || 0) : 0;
            const totalCost = inputCost + outputCost;

            return NextResponse.json({
                success: true,
                response: aiResponse,
                modalId,
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
