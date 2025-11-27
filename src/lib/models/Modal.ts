import { ObjectId } from 'mongodb';

export type ProviderName =
    | 'OpenAI'
    | 'Anthropic'
    | 'Google'
    | 'DeepSeek'
    | 'Perplexity AI'
    | 'xAI'
    | 'Zhipu AI'
    | 'Mistral AI'
    | 'Moonshot AI';

export type RequestType = 'chat' | 'completion' | 'json' | 'image';

// Provider configuration (stores API key once per provider)
export interface ProviderConfig {
    _id?: ObjectId;
    provider: ProviderName;
    api_key: string;
    credit: number;
    totalTokensUsed: number; // Total tokens used across all models
    createdAt?: Date;
    updatedAt?: Date;
}

// Model instance (uses provider's API key)
export interface Modal {
    _id?: ObjectId;
    name: string;
    provider: ProviderName;
    modelId: string; // e.g., gpt-4-turbo, claude-sonnet-4-5
    apiEndpoint: string;
    requestType: RequestType;
    headers?: Record<string, string>; // Custom headers
    responsePath?: string; // e.g., choices[0].message.content
    status: 'active' | 'inactive';
    inputPricePerMillion: number;  // Price per 1M input tokens
    outputPricePerMillion: number; // Price per 1M output tokens
    inputTokensUsed: number; // Total input tokens used by this model
    outputTokensUsed: number; // Total output tokens used by this model
    totalCost: number; // Total cost incurred by this model
    createdAt?: Date;
    updatedAt?: Date;
}

export const ProviderConfigCollection = 'providerConfigs';
export const ModalCollection = 'modals';// Pre-configured provider templates
export interface ProviderTemplate {
    name: ProviderName;
    defaultEndpoint: string;
    defaultRequestType: RequestType;
    defaultResponsePath: string;
    availableModels: {
        id: string;
        name: string;
        inputPricePerMillion: number;
        outputPricePerMillion: number;
    }[];
    requiresAuth: boolean;
    headerTemplate: Record<string, string>;
}

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
    {
        name: 'OpenAI',
        defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'gpt-5.1', name: 'GPT-5.1', inputPricePerMillion: 1.250, outputPricePerMillion: 10.000 },
            { id: 'gpt-5-mini', name: 'GPT-5 mini', inputPricePerMillion: 0.250, outputPricePerMillion: 2.000 },
            { id: 'gpt-5-nano', name: 'GPT-5 nano', inputPricePerMillion: 0.050, outputPricePerMillion: 0.400 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'Anthropic',
        defaultEndpoint: 'https://api.anthropic.com/v1/messages',
        defaultRequestType: 'chat',
        defaultResponsePath: 'content[0].text',
        availableModels: [
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', inputPricePerMillion: 15.00, outputPricePerMillion: 75.00 },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', inputPricePerMillion: 3.00, outputPricePerMillion: 15.00 },
            { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', inputPricePerMillion: 1.00, outputPricePerMillion: 5.00 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'x-api-key': '{{API_KEY}}',
            'anthropic-version': '2023-06-01'
        }
    },
    {
        name: 'Google',
        defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{{MODEL_ID}}:generateContent',
        defaultRequestType: 'chat',
        defaultResponsePath: 'candidates[0].content.parts[0].text',
        availableModels: [
            { id: 'models/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', inputPricePerMillion: 2.00, outputPricePerMillion: 12.00 },
            { id: 'models/gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputPricePerMillion: 1.25, outputPricePerMillion: 10.00 },
            { id: 'models/gemini-2.5-flash', name: 'Gemini 2.5 Flash', inputPricePerMillion: 0.30, outputPricePerMillion: 2.50 },
            { id: 'models/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', inputPricePerMillion: 0.10, outputPricePerMillion: 0.40 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json'
        }
    },
    {
        name: 'DeepSeek',
        defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', inputPricePerMillion: 0.14, outputPricePerMillion: 0.28 },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', inputPricePerMillion: 0.55, outputPricePerMillion: 2.19 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'Perplexity AI',
        defaultEndpoint: 'https://api.perplexity.ai/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large Online', inputPricePerMillion: 1.00, outputPricePerMillion: 1.00 },
            { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small Online', inputPricePerMillion: 0.20, outputPricePerMillion: 0.20 },
            { id: 'llama-3.1-sonar-huge-128k-online', name: 'Sonar Huge Online', inputPricePerMillion: 5.00, outputPricePerMillion: 5.00 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'xAI',
        defaultEndpoint: 'https://api.x.ai/v1/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'grok-beta', name: 'Grok Beta', inputPricePerMillion: 5.00, outputPricePerMillion: 15.00 },
            { id: 'grok-vision-beta', name: 'Grok Vision Beta', inputPricePerMillion: 5.00, outputPricePerMillion: 15.00 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'Zhipu AI',
        defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'glm-4.6', name: 'GLM-4.6', inputPricePerMillion: 0.60, outputPricePerMillion: 2.20 },
            { id: 'glm-4.5-air', name: 'GLM-4.5-Air', inputPricePerMillion: 0.20, outputPricePerMillion: 1.10 },
            { id: 'glm-4.5-flash', name: 'GLM-4.5-Flash', inputPricePerMillion: 0.01, outputPricePerMillion: 0.01 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'Mistral AI',
        defaultEndpoint: 'https://api.mistral.ai/v1/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'mistral-large-latest', name: 'Mistral Large', inputPricePerMillion: 2.00, outputPricePerMillion: 6.00 },
            { id: 'mistral-medium-latest', name: 'Mistral Medium 3', inputPricePerMillion: 0.40, outputPricePerMillion: 2.00 },
            { id: 'mistral-small-latest', name: 'Mistral Small 3.2', inputPricePerMillion: 0.10, outputPricePerMillion: 0.30 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },
    {
        name: 'Moonshot AI',
        defaultEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        defaultRequestType: 'chat',
        defaultResponsePath: 'choices[0].message.content',
        availableModels: [
            { id: 'kimi-latest', name: 'Kimi Latest', inputPricePerMillion: 0.20, outputPricePerMillion: 2.00 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    },

];

