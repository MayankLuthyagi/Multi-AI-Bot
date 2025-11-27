"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Save, Trash2, Loader2, RefreshCw, Edit, X } from "lucide-react";

interface ProviderTemplate {
    name: string;
    availableModels: { id: string; name: string; inputPricePerMillion: number; outputPricePerMillion: number }[];
    defaultEndpoint: string;
    defaultRequestType: string;
    defaultResponsePath: string;
    headerTemplate: Record<string, string>;
}

interface ProviderConfig {
    provider: string;
    credit: number;
    totalTokensUsed: number;
    // Note: API key is NOT included for security reasons - it's stored server-side only
}

interface Modal {
    _id: string;
    provider: string;
    modelId: string;
    status: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    name: string;
    inputTokensUsed: number;
    outputTokensUsed: number;
    totalCost: number;
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState<ProviderTemplate[]>([]);
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
    const [modals, setModals] = useState<Modal[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [apiKey, setApiKey] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [editingModels, setEditingModels] = useState<Modal[]>([]);
    const [editingApiKey, setEditingApiKey] = useState<string>("");
    const [editingCredit, setEditingCredit] = useState<{ provider: string; credit: number } | null>(null);
    const [initialCredit, setInitialCredit] = useState<number>(0);

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
                body: JSON.stringify({
                    provider: selectedProvider,
                    api_key: apiKey,
                    credit: initialCredit
                }),
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
                            inputPricePerMillion: model.inputPricePerMillion,
                            outputPricePerMillion: model.outputPricePerMillion,
                        }),
                    });
                }
            }

            await fetchData();
            setSelectedProvider("");
            setApiKey("");
            setInitialCredit(0);
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

    const handleEditProvider = (provider: string) => {
        const providerModals = modals.filter((m) => m.provider === provider);
        // Ensure all price fields have default values
        const modalsWithDefaults = providerModals.map(m => ({
            ...m,
            inputPricePerMillion: m.inputPricePerMillion ?? 0,
            outputPricePerMillion: m.outputPricePerMillion ?? 0,
            inputTokensUsed: m.inputTokensUsed ?? 0,
            outputTokensUsed: m.outputTokensUsed ?? 0,
            totalCost: m.totalCost ?? 0
        }));
        setEditingModels(modalsWithDefaults);
        setEditingProvider(provider);

        // Initialize API key input as empty (user can update it if needed)
        setEditingApiKey("");
    };

    const handleUpdatePrice = (modelId: string, inputPrice: number, outputPrice: number) => {
        setEditingModels((prev) =>
            prev.map((m) =>
                m._id === modelId ? { ...m, inputPricePerMillion: inputPrice, outputPricePerMillion: outputPrice } : m
            )
        );
    };

    const handleSavePrices = async () => {
        setSaving(true);
        try {
            // Update API key if changed
            if (editingApiKey && editingProvider) {
                await fetch("/api/provider-configs", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: editingProvider,
                        api_key: editingApiKey,
                    }),
                });
            }

            // Update model prices
            for (const modal of editingModels) {
                await fetch("/api/modals", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        _id: modal._id,
                        inputPricePerMillion: modal.inputPricePerMillion,
                        outputPricePerMillion: modal.outputPricePerMillion,
                    }),
                });
            }

            await fetchData();
            setEditingProvider(null);
            setEditingModels([]);
            setEditingApiKey("");
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleEditCredit = (provider: string, currentCredit: number) => {
        setEditingCredit({ provider, credit: currentCredit });
    };

    const handleSaveCredit = async () => {
        if (!editingCredit) return;

        setSaving(true);
        try {
            await fetch("/api/provider-configs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: editingCredit.provider,
                    credit: editingCredit.credit,
                }),
            });

            await fetchData();
            setEditingCredit(null);
            alert("Credit updated successfully!");
        } catch (error) {
            console.error("Error updating credit:", error);
            alert("Failed to update credit");
        } finally {
            setSaving(false);
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

                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-8">
                    <div className="space-y-4">
                        <div>
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

                        {selectedProvider && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Initial Credit ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={initialCredit}
                                    onChange={(e) => setInitialCredit(parseFloat(e.target.value) || 0)}
                                    placeholder="Enter initial credit amount (optional)"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Set the credit budget for this provider (can be updated later)
                                </p>
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
                                const totalCost = providerModals.reduce((sum, m) => sum + (m.totalCost || 0), 0);
                                const creditLeft = (config.credit || 0) - totalCost;

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
                                                    onClick={() => handleEditProvider(config.provider)}
                                                    className="text-green-500 hover:text-green-600"
                                                    title="Edit model prices"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
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

                                            {/* Credit Information */}
                                            <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Credit:
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                            ${config.credit?.toFixed(2) || '0.00'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleEditCredit(config.provider, config.credit || 0)}
                                                            className="text-blue-500 hover:text-blue-600"
                                                            title="Edit credit"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        Tokens:
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {(config.totalTokensUsed || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                Models: {providerModals.length}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                {providerModals.map((modal) => (
                                                    <div
                                                        key={modal._id}
                                                        className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`w-2 h-2 rounded-full ${modal.status === "active"
                                                                    ? "bg-green-500"
                                                                    : "bg-gray-400"
                                                                    }`}
                                                            />
                                                            {modal.modelId}
                                                        </div>
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

                {/* Edit Price Modal */}
                {editingProvider && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-zinc-800 p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Edit Provider Settings - {editingProvider}
                                </h2>
                                <button
                                    onClick={() => {
                                        setEditingProvider(null);
                                        setEditingModels([]);
                                        setEditingApiKey("");
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* API Key Section */}
                                <div className="pb-6 border-b border-gray-200 dark:border-zinc-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <Key className="w-5 h-5" />
                                        API Key
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Update API Key (optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={editingApiKey}
                                            onChange={(e) => setEditingApiKey(e.target.value)}
                                            placeholder="Leave empty to keep current key"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                        />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Enter a new API key only if you want to update it. Leave blank to keep the existing key.
                                        </p>
                                    </div>
                                </div>

                                {/* Model Prices Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Model Pricing
                                    </h3>
                                    <div className="space-y-4">
                                        {editingModels.map((modal) => (
                                            <div
                                                key={modal._id}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {modal.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {modal.modelId}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            Input $
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={modal.inputPricePerMillion ?? 0}
                                                            onChange={(e) =>
                                                                handleUpdatePrice(modal._id, parseFloat(e.target.value) || 0, modal.outputPricePerMillion ?? 0)
                                                            }
                                                            className="w-24 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            /1M
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            Output $
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={modal.outputPricePerMillion ?? 0}
                                                            onChange={(e) =>
                                                                handleUpdatePrice(modal._id, modal.inputPricePerMillion ?? 0, parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-24 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            /1M
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white dark:bg-zinc-800 p-6 border-t border-gray-200 dark:border-zinc-700 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setEditingProvider(null);
                                        setEditingModels([]);
                                        setEditingApiKey("");
                                    }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrices}
                                    disabled={saving}
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
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Credit Modal */}
                {editingCredit && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Edit Credit - {editingCredit.provider}
                                </h2>
                                <button
                                    onClick={() => setEditingCredit(null)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Credit Amount ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingCredit.credit}
                                    onChange={(e) =>
                                        setEditingCredit({
                                            ...editingCredit,
                                            credit: parseFloat(e.target.value) || 0
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Enter credit amount"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    This is the total credit budget allocated for this provider
                                </p>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingCredit(null)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCredit}
                                    disabled={saving}
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
                                            Save Credit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
