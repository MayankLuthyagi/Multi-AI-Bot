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

// Active platforms storage (shared with admin)
let platforms: any[] = [
    {
        id: "1",
        name: "OpenAI",
        apiKey: "sk-example-key",
        endpoint: "https://api.openai.com/v1/chat/completions",
        isActive: true,
        description: "ChatGPT platform with GPT models"
    },
    {
        id: "2",
        name: "Anthropic",
        apiKey: "sk-example-claude-key",
        endpoint: "https://api.anthropic.com/v1/messages",
        isActive: true,
        description: "Claude AI platform"
    },
    {
        id: "3",
        name: "Google",
        apiKey: "example-gemini-key",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
        isActive: true,
        description: "Google Gemini platform"
    },
    {
        id: "4",
        name: "xAI",
        apiKey: "example-grok-key",
        endpoint: "https://api.x.ai/v1/chat/completions",
        isActive: true,
        description: "Grok AI platform"
    },
    {
        id: "5",
        name: "Perplexity",
        apiKey: "example-perplexity-key",
        endpoint: "https://api.perplexity.ai/chat/completions",
        isActive: true,
        description: "Perplexity AI with web search"
    },
    {
        id: "6",
        name: "DeepSeek",
        apiKey: "example-deepseek-key",
        endpoint: "https://api.deepseek.com/chat/completions",
        isActive: true,
        description: "DeepSeek reasoning models"
    },
    {
        id: "7",
        name: "Cohere",
        apiKey: "example-cohere-key",
        endpoint: "https://api.cohere.ai/v1/chat",
        isActive: true,
        description: "Cohere language models"
    },
    {
        id: "8",
        name: "Mistral",
        apiKey: "example-mistral-key",
        endpoint: "https://api.mistral.ai/v1/chat/completions",
        isActive: true,
        description: "Mistral AI models"
    }
];

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Get active platforms for the user
        const userPlatforms = await AIPlatform.find({
            userId: session.user.id,
            isActive: true
        }).select('name endpoint');

        // Map platform names to known providers based on endpoint or name
        const platformMapping: Record<string, string> = {};

        userPlatforms.forEach(platform => {
            const endpoint = platform.endpoint?.toLowerCase() || '';
            const name = platform.name?.toLowerCase() || '';

            // Map based on endpoint patterns
            if (endpoint.includes('openai.com') || name.includes('openai') || name.includes('gpt')) {
                platformMapping[platform.name] = 'OpenAI';
            } else if (endpoint.includes('anthropic.com') || name.includes('anthropic') || name.includes('claude')) {
                platformMapping[platform.name] = 'Anthropic';
            } else if (endpoint.includes('googleapis.com') || endpoint.includes('google') || name.includes('google') || name.includes('gemini')) {
                platformMapping[platform.name] = 'Google';
            } else if (endpoint.includes('x.ai') || name.includes('xai') || name.includes('grok')) {
                platformMapping[platform.name] = 'xAI';
            } else if (endpoint.includes('perplexity') || name.includes('perplexity')) {
                platformMapping[platform.name] = 'Perplexity';
            } else if (endpoint.includes('deepseek') || name.includes('deepseek')) {
                platformMapping[platform.name] = 'DeepSeek';
            } else if (endpoint.includes('cohere') || name.includes('cohere')) {
                platformMapping[platform.name] = 'Cohere';
            } else if (endpoint.includes('mistral') || name.includes('mistral')) {
                platformMapping[platform.name] = 'Mistral';
            } else {
                // Fallback: map to all providers for testing if endpoint is unclear
                platformMapping[platform.name] = 'OpenAI';
            }
        });

        const mappedProviders = Object.values(platformMapping);

        // Convert to Model array format
        const models: any[] = [];

        // If user has any platform configured, show models from all major providers for demo purposes
        const providersToShow = userPlatforms.length > 0 ? Object.keys(availableModels) : [];

        providersToShow.forEach((provider) => {
            const modelList = availableModels[provider as keyof typeof availableModels];
            modelList.forEach((modelName) => {
                models.push({
                    id: `${provider.toLowerCase()}-${modelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    name: modelName,
                    provider: provider,
                    description: modelName, // Just the model name, no extra text
                    isActive: true,
                    modelId: modelName,
                    supportsImages: ['GPT-4o', 'GPT-4-Turbo', 'Claude-3-Opus', 'Claude-3-Sonnet', 'Gemini-1.5-Pro'].includes(modelName),
                    maxTokens: modelName.includes('16K') ? 16000 :
                        modelName.includes('GPT-4') ? 8000 :
                            modelName.includes('Claude') ? 100000 :
                                provider === 'Cohere' ? 0 : 4000
                });
            });
        });

        return NextResponse.json(models);
    } catch (error) {
        console.error("Error fetching models:", error);
        // Return empty array on error to avoid breaking frontend
        return NextResponse.json([]);
    }
}