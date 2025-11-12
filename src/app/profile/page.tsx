"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Save, Trash2, Loader2, RefreshCw } from "lucide-react";

interface ProviderTemplate {
    name: string;
    availableModels: { id: string; name: string; costPer1KTokens: number }[];
    defaultEndpoint: string;
    defaultRequestType: string;
    defaultResponsePath: string;
    headerTemplate: Record<string, string>;
}

interface ProviderConfig {
    provider: string;
    apiKey: string;
}

interface Modal {
    _id: string;
    provider: string;
    modelId: string;
    status: string;
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState<ProviderTemplate[]>([]);
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
    const [modals, setModals] = useState<Modal[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [apiKey, setApiKey] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [providersRes, configsRes, modalsRes] = await Promise.all([
                fetch("/api/providers"),
                fetch("/api/provider-configs"),
                fetch("/api/modals"),
            ]);

            const providersData = await providersRes.json();
            const configsData = await configsRes.json();
            const modalsData = await modalsRes.json();

            setProviders(providersData.providers || []);
            setProviderConfigs(configsData.configs || []);
            setModals(modalsData.modals || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProvider = async () => {
        if (!selectedProvider || !apiKey) return;

        setSaving(true);
        try {
            const configRes = await fetch("/api/provider-configs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: selectedProvider, api_key: apiKey }),
            });

            if (!configRes.ok) throw new Error("Failed to save provider config");

            const providerTemplate = providers.find((p) => p.name === selectedProvider);
            if (providerTemplate) {
                for (const model of providerTemplate.availableModels) {
                    await fetch("/api/modals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: model.name,
                            provider: selectedProvider,
                            modelId: model.id,
                            apiEndpoint: providerTemplate.defaultEndpoint,
                            requestType: providerTemplate.defaultRequestType,
                            headers: providerTemplate.headerTemplate,
                            responsePath: providerTemplate.defaultResponsePath,
                            costPer1KTokens: model.costPer1KTokens,
                        }),
                    });
                }
            }

            await fetchData();
            setSelectedProvider("");
            setApiKey("");
            alert("Provider saved successfully!");
        } catch (error) {
            console.error("Error saving provider:", error);
            alert("Failed to save provider");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProvider = async (provider: string) => {
        if (!confirm(`Delete ${provider} and all its models?`)) return;

        try {
            await fetch(`/api/provider-configs?provider=${provider}`, {
                method: "DELETE",
            });

            const providerModals = modals.filter((m) => m.provider === provider);
            for (const modal of providerModals) {
                await fetch(`/api/modals?id=${modal._id}`, { method: "DELETE" });
            }

            await fetchData();
        } catch (error) {
            console.error("Error deleting provider:", error);
            alert("Failed to delete provider");
        }
    };

    const handleSyncModels = async (provider: string) => {
        try {
            const res = await fetch("/api/modals/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider }),
            });

            const data = await res.json();
            if (data.success) {
                await fetchData();
                alert(`Successfully synced ${data.count} models for ${provider}`);
            } else {
                alert(`Failed to sync models: ${data.error}`);
            }
        } catch (error) {
            console.error("Error syncing models:", error);
            alert("Failed to sync models");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                    AI Provider Management
                </h1>

                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Provider
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Provider
                            </label>
                            <select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">Choose a provider...</option>
                                {providers
                                    .filter((p) => !providerConfigs.find((c) => c.provider === p.name))
                                    .map((provider) => (
                                        <option key={provider.name} value={provider.name}>
                                            {provider.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {selectedProvider && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API key"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSaveProvider}
                            disabled={!selectedProvider || !apiKey || saving}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Provider
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Configured Providers
                    </h2>

                    {providerConfigs.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                No providers configured yet. Add one above to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {providerConfigs.map((config) => {
                                const providerModals = modals.filter((m) => m.provider === config.provider);
                                return (
                                    <div
                                        key={config.provider}
                                        className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {config.provider}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSyncModels(config.provider)}
                                                    className="text-blue-500 hover:text-blue-600"
                                                    title="Sync models to latest version"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProvider(config.provider)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                API Key: •••••••••
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Models: {providerModals.length}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                {providerModals.map((modal) => (
                                                    <div
                                                        key={modal._id}
                                                        className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2"
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${modal.status === "active"
                                                                ? "bg-green-500"
                                                                : "bg-gray-400"
                                                                }`}
                                                        />
                                                        {modal.modelId}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
