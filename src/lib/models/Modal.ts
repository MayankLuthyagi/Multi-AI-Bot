import { ObjectId } from 'mongodb';

export type ProviderName =
    | 'OpenAI'
    | 'Anthropic'
    | 'Google'
    | 'DeepSeek'
    | 'Perplexity AI'
    | 'xAI'
    | 'Mistral AI';

export type RequestType = 'chat' | 'completion' | 'json' | 'image';

// Provider configuration (stores API key once per provider)
export interface ProviderConfig {
    _id?: ObjectId;
    provider: ProviderName;
    api_key: string;
    credit: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Model instance (uses provider's API key)
export interface Modal {
    _id?: ObjectId;
    name: string;
    provider: ProviderName;
    modelId: string; // e.g., gpt-4-turbo, claude-3-5-sonnet
    apiEndpoint: string;
    requestType: RequestType;
    headers?: Record<string, string>; // Custom headers
    responsePath?: string; // e.g., choices[0].message.content
    status: 'active' | 'inactive';
    costPer1KTokens: number;
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
        costPer1KTokens: number;
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
            { id: 'gpt-5', name: 'GPT-5', costPer1KTokens: 0.02 },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', costPer1KTokens: 0.01 },
            { id: 'gpt-4', name: 'GPT-4', costPer1KTokens: 0.03 },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', costPer1KTokens: 0.001 },
            { id: 'gpt-4o', name: 'GPT-4o', costPer1KTokens: 0.005 },
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
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', costPer1KTokens: 0.003 },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', costPer1KTokens: 0.015 },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', costPer1KTokens: 0.003 },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', costPer1KTokens: 0.00025 },
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
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', costPer1KTokens: 0.00125 },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', costPer1KTokens: 0.000075 },
            { id: 'gemini-pro', name: 'Gemini Pro', costPer1KTokens: 0.0005 },
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
            { id: 'deepseek-chat', name: 'DeepSeek Chat', costPer1KTokens: 0.00014 },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', costPer1KTokens: 0.00014 },
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
            { id: 'sonar', name: 'Sonar (Lightweight)', costPer1KTokens: 0.0002 },
            { id: 'sonar-pro', name: 'Sonar Pro (Advanced)', costPer1KTokens: 0.001 },
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
            { id: 'grok-beta', name: 'Grok Beta', costPer1KTokens: 0.005 },
            { id: 'grok-vision-beta', name: 'Grok Vision Beta', costPer1KTokens: 0.005 },
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
            { id: 'mistral-large-latest', name: 'Mistral Large', costPer1KTokens: 0.004 },
            { id: 'mistral-medium-latest', name: 'Mistral Medium', costPer1KTokens: 0.0027 },
            { id: 'mistral-small-latest', name: 'Mistral Small', costPer1KTokens: 0.001 },
            { id: 'open-mistral-7b', name: 'Open Mistral 7B', costPer1KTokens: 0.00025 },
        ],
        requiresAuth: true,
        headerTemplate: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {{API_KEY}}'
        }
    }
];

