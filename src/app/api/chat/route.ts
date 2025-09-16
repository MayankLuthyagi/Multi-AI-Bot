import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import dbConnect from "../../../lib/mongodb";
import { AIPlatform } from "../../../lib/models";

// Frontend model definitions (no API keys, just model names and platform info)
const availableModels = {
    "OpenAI": [
        "GPT-5",
        "GPT-4o",
        "GPT-4o-mini",
        "GPT-4-Turbo",
        "GPT-4",
        "GPT-3.5-Turbo",
        "GPT-3.5-Turbo-16K"
    ],
    "Anthropic": [
        "Claude-4",
        "Claude-3.5-Sonnet",
        "Claude-3-Opus",
        "Claude-3-Sonnet",
        "Claude-3-Haiku",
        "Claude-2.1",
        "Claude-2"
    ],
    "Google": [
        "Gemini-2.0-Flash",
        "Gemini-1.5-Pro",
        "Gemini-1.5-Flash",
        "Gemini-1.0-Pro",
        "PaLM-2"
    ],
    "xAI": [
        "Grok-2",
        "Grok-Beta",
        "Grok-1.5"
    ],
    "Perplexity": [
        "Sonar-Large-Online",
        "Sonar-Small-Online",
        "Sonar-Large-Chat",
        "Sonar-Small-Chat"
    ],
    "DeepSeek": [
        "DeepSeek-V3",
        "DeepSeek-Chat",
        "DeepSeek-Coder",
        "DeepSeek-Math"
    ],
    "Cohere": [
        "Command-R-Plus",
        "Command-R",
        "Command-Light"
    ],
    "Mistral": [
        "Mistral-Large-2",
        "Mistral-Large",
        "Mistral-Medium",
        "Mistral-Small",
        "Mixtral-8x7B",
        "Mixtral-8x22B"
    ]
};

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface ChatRequest {
    message: string;
    modelIds: string[];
    conversationHistory?: ChatMessage[];
}

// Provider-specific API adapters
class APIAdapters {
    static async callOpenAI(model: any, messages: ChatMessage[]) {
        const response = await fetch(model.endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${model.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model.modelId,
                messages: messages,
                max_tokens: Math.min(model.maxTokens, 4096),
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || "No response",
            usage: data.usage,
            error: false,
        };
    }

    static async callAnthropic(model: any, messages: ChatMessage[]) {
        // Convert messages format for Anthropic
        const systemMessage = messages.find(m => m.role === "system");
        const userMessages = messages.filter(m => m.role !== "system");

        const response = await fetch(model.endpoint, {
            method: "POST",
            headers: {
                "x-api-key": model.apiKey,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: model.modelId,
                max_tokens: Math.min(model.maxTokens, 4096),
                system: systemMessage?.content || undefined,
                messages: userMessages.map(msg => ({
                    role: msg.role === "assistant" ? "assistant" : "user",
                    content: msg.content,
                })),
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.content[0]?.text || "No response",
            usage: data.usage,
            error: false,
        };
    }

    static async callGoogle(model: any, messages: ChatMessage[]) {
        // Convert messages for Gemini format
        const contents = messages
            .filter(m => m.role !== "system")
            .map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

        const response = await fetch(`${model.endpoint}?key=${model.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    maxOutputTokens: Math.min(model.maxTokens, 8192),
                    temperature: 0.7,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Google API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0]?.content?.parts[0]?.text || "No response",
            usage: data.usageMetadata,
            error: false,
        };
    }

    static async callGeneric(model: any, messages: ChatMessage[]) {
        // Generic OpenAI-compatible format for xAI, Perplexity, DeepSeek, Mistral
        const response = await fetch(model.endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${model.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model.modelId,
                messages: messages,
                max_tokens: Math.min(model.maxTokens, 4096),
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`${model.provider} API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0]?.message?.content || "No response",
            usage: data.usage,
            error: false,
        };
    }

    static async callCohere(model: any, messages: ChatMessage[]) {
        // Convert to Cohere format
        const chatHistory = messages.slice(0, -1).map(msg => ({
            role: msg.role.toUpperCase(),
            message: msg.content,
        }));
        const lastMessage = messages[messages.length - 1];

        const response = await fetch(model.endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${model.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model.modelId,
                message: lastMessage.content,
                chat_history: chatHistory,
                max_tokens: Math.min(model.maxTokens, 4096),
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.text || "No response",
            usage: data.meta,
            error: false,
        };
    }
}

async function callModel(model: any, messages: ChatMessage[]) {
    try {
        switch (model.provider) {
            case "OpenAI":
                return await APIAdapters.callOpenAI(model, messages);
            case "Anthropic":
                return await APIAdapters.callAnthropic(model, messages);
            case "Google":
                return await APIAdapters.callGoogle(model, messages);
            case "Cohere":
                return await APIAdapters.callCohere(model, messages);
            case "xAI":
            case "Perplexity":
            case "DeepSeek":
            case "Mistral":
                return await APIAdapters.callGeneric(model, messages);
            default:
                throw new Error(`Unsupported provider: ${model.provider}`);
        }
    } catch (error) {
        console.error(`Error calling ${model.provider}:`, error);
        return {
            content: `Error: Failed to get response from ${model.name}`,
            usage: null,
            error: true,
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: ChatRequest = await request.json();
        const { message, modelIds, conversationHistory = [] } = body;

        if (!message || !modelIds || modelIds.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        // Get user's platforms with API keys
        const userPlatforms = await AIPlatform.find({
            userId: session.user.id,
            isActive: true
        });

        if (userPlatforms.length === 0) {
            return NextResponse.json({ error: "No active AI platforms found. Please configure platforms in the admin panel." }, { status: 400 });
        }

        // Create platform lookup map with provider mapping
        const platformMap = userPlatforms.reduce((acc, platform) => {
            const endpoint = platform.endpoint?.toLowerCase() || '';
            const name = platform.name?.toLowerCase() || '';

            let mappedProvider = '';

            // Map based on endpoint patterns
            if (endpoint.includes('openai.com') || name.includes('openai') || name.includes('gpt')) {
                mappedProvider = 'OpenAI';
            } else if (endpoint.includes('anthropic.com') || name.includes('anthropic') || name.includes('claude')) {
                mappedProvider = 'Anthropic';
            } else if (endpoint.includes('googleapis.com') || endpoint.includes('google') || name.includes('google') || name.includes('gemini')) {
                mappedProvider = 'Google';
            } else if (endpoint.includes('x.ai') || name.includes('xai') || name.includes('grok')) {
                mappedProvider = 'xAI';
            } else if (endpoint.includes('perplexity') || name.includes('perplexity')) {
                mappedProvider = 'Perplexity';
            } else if (endpoint.includes('deepseek') || name.includes('deepseek')) {
                mappedProvider = 'DeepSeek';
            } else if (endpoint.includes('cohere') || name.includes('cohere')) {
                mappedProvider = 'Cohere';
            } else if (endpoint.includes('mistral') || name.includes('mistral')) {
                mappedProvider = 'Mistral';
            } else {
                // Fallback: if no specific pattern matches, default to OpenAI for testing
                // This allows platforms with non-standard endpoints to still work
                mappedProvider = 'OpenAI';
            }

            if (mappedProvider) {
                acc[mappedProvider] = platform;
            }

            return acc;
        }, {} as Record<string, any>);

        // Convert model IDs to actual models with API keys
        const selectedModels: any[] = [];

        modelIds.forEach((modelId: string) => {
            // Parse the model ID to extract provider and model name
            const parts = modelId.split('-');
            if (parts.length < 2) return;

            const provider = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            const modelName = parts.slice(1).join('-').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            // Find matching model name in available models
            const availableProviderModels = availableModels[provider as keyof typeof availableModels];
            if (!availableProviderModels) return;

            const matchingModel = availableProviderModels.find((model: string) =>
                modelId === `${provider.toLowerCase()}-${model.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
            );

            if (!matchingModel) return;

            // Get platform configuration
            const platformConfig = platformMap[provider];
            if (!platformConfig) return;

            selectedModels.push({
                id: modelId,
                name: matchingModel,
                provider: provider,
                apiKey: platformConfig.apiKey,
                endpoint: platformConfig.endpoint,
                isActive: true,
                modelId: matchingModel,
                supportsImages: ['GPT-4o', 'GPT-4-Turbo', 'Claude-3-Opus', 'Claude-3-Sonnet', 'Gemini-1.5-Pro'].includes(matchingModel),
                maxTokens: matchingModel.includes('16K') ? 16000 :
                    matchingModel.includes('GPT-4') ? 8000 :
                        matchingModel.includes('Claude') ? 100000 : 4000
            });
        });

        if (selectedModels.length === 0) {
            return NextResponse.json({ error: "No valid models selected or no platforms configured" }, { status: 400 });
        }

        // Prepare messages for API calls
        const messages: ChatMessage[] = [
            ...conversationHistory,
            { role: "user", content: message }
        ];

        // Call all selected models in parallel
        const modelPromises = selectedModels.map(async (model: any) => {
            const result = await callModel(model, messages);
            return {
                modelId: model.id,
                modelName: model.name,
                provider: model.provider,
                response: result.content,
                usage: result.usage,
                error: result.error || false,
            };
        });

        const responses = await Promise.all(modelPromises);

        return NextResponse.json({
            responses,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}