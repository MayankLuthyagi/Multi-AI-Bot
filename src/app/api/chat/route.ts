import { NextRequest, NextResponse } from 'next/server';

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
function buildRequestBody(provider: string, modelId: string, message: string): any {
    const baseParams = {
        temperature: 0.7,
        max_tokens: 1000,
    };

    switch (provider) {
        case 'OpenAI':
        case 'DeepSeek':
        case 'xAI':
        case 'Mistral AI':
        case 'Perplexity AI':
            return {
                model: modelId,
                messages: [{ role: 'user', content: message }],
                ...baseParams,
            };

        case 'Anthropic':
            return {
                model: modelId,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1000,
            };

        case 'Google':
            return {
                contents: [{
                    parts: [{ text: message }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            };

        default:
            return {
                messages: [{ role: 'user', content: message }],
                ...baseParams,
            };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { modalId, message, apiEndpoint, apiKey, provider, modelId, headers, responsePath } = body;

        if (!modalId || !message || !apiEndpoint) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

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

        // Build request body based on provider
        const requestBody = buildRequestBody(provider || 'OpenAI', modelId, message);

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

            return NextResponse.json({
                success: true,
                response: aiResponse,
                modalId,
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
