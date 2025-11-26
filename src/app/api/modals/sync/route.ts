import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { Modal, ModalCollection, PROVIDER_TEMPLATES, ProviderConfigCollection } from '@/src/lib/models/Modal';

// POST - Sync models for a provider (delete old, add new from template)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider } = body;

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider name is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Find the provider template
        const providerTemplate = PROVIDER_TEMPLATES.find(p => p.name === provider);
        if (!providerTemplate) {
            return NextResponse.json(
                { success: false, error: 'Provider template not found' },
                { status: 404 }
            );
        }

        // Get status of existing models before deleting (to preserve activation state)
        const existingModals = await db.collection<Modal>(ModalCollection)
            .find({ provider })
            .toArray();

        const activeModelIds = new Set(
            existingModals
                .filter(m => m.status === 'active')
                .map(m => m.modelId)
        );

        // Delete all existing models for this provider
        await db.collection<Modal>(ModalCollection).deleteMany({ provider });

        // Attempt to fetch live model list from provider API if we have provider credentials.
        let sourceModels: { id: string; name: string; inputPricePerMillion: number; outputPricePerMillion: number }[] = providerTemplate.availableModels;
        try {
            const providerConfig = await db.collection(ProviderConfigCollection).findOne({ provider });
            if (providerConfig && providerConfig.api_key) {
                const apiKey = providerConfig.api_key as string;
                let url = '';
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };

                if (provider === 'Google') {
                    // Google Generative Language models endpoint (use key query param)
                    url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
                } else if (provider === 'OpenAI') {
                    url = 'https://api.openai.com/v1/models';
                    headers['Authorization'] = `Bearer ${apiKey}`;
                } else if (provider === 'Anthropic') {
                    url = 'https://api.anthropic.com/v1/models';
                    headers['x-api-key'] = apiKey;
                    // include version if template provided one
                    if (providerTemplate.headerTemplate && providerTemplate.headerTemplate['anthropic-version']) {
                        headers['anthropic-version'] = providerTemplate.headerTemplate['anthropic-version'];
                    }
                }

                if (url) {
                    const resp = await fetch(url, { headers });
                    if (resp.ok) {
                        const data = await resp.json();
                        let modelsArr: any[] = [];

                        // Try common response shapes: OpenAI -> { data: [...] }, Anthropic -> { models: [...] }, Google -> { models: [...] }
                        if (Array.isArray(data.data)) modelsArr = data.data;
                        else if (Array.isArray(data.models)) modelsArr = data.models;
                        else if (Array.isArray(data)) modelsArr = data;

                        if (modelsArr.length > 0) {
                            // Map remote models to the internal shape, keep cost if available from template
                            const templateCosts = new Map(providerTemplate.availableModels.map(m => [m.id, { input: m.inputPricePerMillion, output: m.outputPricePerMillion }]));
                            sourceModels = modelsArr.map(m => {
                                // Different providers may use different key names
                                const id = m.id || m.name || m.model || m.modelId || m.nameId || m.model_id;
                                const name = m.name || m.display_name || m.id || id;
                                const costs = templateCosts.get(id) || { input: 0, output: 0 };
                                return { id: String(id), name: String(name), inputPricePerMillion: costs.input, outputPricePerMillion: costs.output };
                            }).filter(x => x.id);

                            // Whitelist: only keep the models the user requested per provider
                            const ALLOWED_MODELS: Record<string, string[]> = {
                                'OpenAI': [
                                    'gpt-5.1', 'gpt-5-mini', 'gpt-5-nano'
                                ],
                                'Anthropic': [
                                    'claude-opus-4-5-20250514', 'claude-opus-4-5',
                                    'claude-sonnet-4-5-20250514', 'claude-sonnet-4-5',
                                    'claude-haiku-4-5-20250514', 'claude-haiku-4-5'
                                ],
                                'Google': [
                                    'models/gemini-3-pro-preview', 'models/gemini-2.5-pro',
                                    'models/gemini-2.5-flash', 'models/gemini-2.5-flash-lite'
                                ],
                                'DeepSeek': [
                                    'deepseek-chat', 'deepseek-reasoner'
                                ],
                                'Perplexity AI': [
                                    'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-huge-128k-online'
                                ],
                                'Zhipu AI': [
                                    'glm-4.6', 'glm-4.5-air', 'glm-4.5-flash'
                                ]
                            };

                            const allowed = ALLOWED_MODELS[provider];
                            if (allowed && allowed.length > 0) {
                                const allowedSet = new Set(allowed.map(s => s.toLowerCase()));
                                // Normalize IDs and keep only allowed ones. Some providers prefix model ids with 'models/'.
                                const filtered = sourceModels.filter(m => {
                                    const id = String(m.id).toLowerCase();
                                    const idNoPrefix = id.startsWith('models/') ? id : id;
                                    return allowedSet.has(id) || allowedSet.has(idNoPrefix);
                                });

                                // If filtering removed all models, fall back to template
                                if (filtered.length > 0) {
                                    sourceModels = filtered;
                                } else {
                                    console.warn('No models matched whitelist for', provider, '- using template models');
                                    sourceModels = providerTemplate.availableModels;
                                }
                            }
                        }
                    } else {
                        console.warn('Failed to fetch provider models, falling back to template:', provider, await resp.text());
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching remote models for provider:', provider, err);
        }

        // Create new models from sourceModels (live models if fetched, otherwise template)
        const newModals = sourceModels.map(model => {
            const status = activeModelIds.has(model.id) ? 'active' : 'inactive';
            return {
                name: model.name,
                provider: providerTemplate.name,
                modelId: model.id,
                apiEndpoint: providerTemplate.defaultEndpoint,
                requestType: providerTemplate.defaultRequestType,
                headers: providerTemplate.headerTemplate,
                responsePath: providerTemplate.defaultResponsePath,
                status: status as 'active' | 'inactive',
                inputPricePerMillion: model.inputPricePerMillion || 0,
                outputPricePerMillion: model.outputPricePerMillion || 0,
                inputTokensUsed: 0,
                outputTokensUsed: 0,
                totalCost: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });

        if (newModals.length > 0) {
            await db.collection<Modal>(ModalCollection).insertMany(newModals);
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${newModals.length} models for ${provider}`,
            count: newModals.length
        });
    } catch (error) {
        console.error('Error syncing models:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync models' },
            { status: 500 }
        );
    }
}
