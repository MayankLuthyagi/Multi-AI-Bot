"use client";

import React, { useEffect, useState } from "react";
import { Key, Save, Trash2, Loader2, Edit, X } from "lucide-react";
import { useRouter } from "next/navigation";
import SideMenu from "../components/SideMenu";

// -----------------------------
// Types
// -----------------------------
interface ProviderTemplate {
  name: string;
  availableModels: {
    id: string;
    name: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
  }[];
  defaultEndpoint: string;
  defaultRequestType: string;
  defaultResponsePath: string;
  headerTemplate: Record<string, string>;
}

interface ProviderConfig {
  provider: string;
  credit: number;
  totalTokensUsed: number;
}

interface ModelType {
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

// -----------------------------
const currency = (n?: number) => `$${(n ?? 0).toFixed(2)}`;

// -----------------------------
// Reusable Components
// -----------------------------
function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-800 text-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-zinc-800 px-4 sm:px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <h3 className="text-sm sm:text-lg xl:text-xl font-semibold">{title}</h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 grow">{children}</div>

        {footer && (
          <div className="sticky bottom-0 bg-zinc-800 px-4 sm:px-6 py-4 border-t border-zinc-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelPriceRow({
  model,
  onChange,
}: {
  model: ModelType;
  onChange: (id: string, input: number, output: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-zinc-700 p-3 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-xs sm:text-sm xl:text-base text-white">{model.name}</p>

        <p className="text-[10px] sm:text-xs xl:text-sm text-gray-400 truncate">
          {model.modelId}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

        <div className="flex items-center gap-2">
          <span className="w-16 sm:text-xs xl:text-sm text-gray-400">
            Input $
          </span>

          <input
            type="number"
            step="0.01"
            value={model.inputPricePerMillion ?? 0}
            onChange={(e) =>
              onChange(
                model._id,
                parseFloat(e.target.value) || 0,
                model.outputPricePerMillion ?? 0
              )
            }
            className="w-full sm:w-28 px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-800 text-white text-xs sm:text-sm xl:text-base"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-16 sm:text-xs xl:text-sm text-gray-400">
            Output $
          </span>

          <input
            type="number"
            step="0.01"
            value={model.outputPricePerMillion ?? 0}
            onChange={(e) =>
              onChange(
                model._id,
                model.inputPricePerMillion ?? 0,
                parseFloat(e.target.value) || 0
              )
            }
            className="w-full sm:w-28 px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-800 text-white text-xs sm:text-sm xl:text-base"
          />
        </div>
      </div>
    </div>
  );
}

function ProviderCard({
  config,
  models,
  onEdit,
  onDelete,
}: {
  config: ProviderConfig;
  models: ModelType[];
  onEdit: (provider: string) => void;
  onDelete: (provider: string) => void;
}) {
  const totalCost = models.reduce((s, m) => s + (m.totalCost || 0), 0);
  const creditLeft = (config.credit || 0) - totalCost;

  return (
    <div className="bg-zinc-800 text-white rounded-lg shadow-md p-6">

      <div className="flex justify-between">
        <div>
          <h4 className="font-semibold text-xs sm:text-sm xl:text-lg">
            {config.provider}
          </h4>

          <p className="text-[10px] sm:text-xs xl:text-sm text-gray-400">
            Credit: {currency(config.credit)}
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={() => onEdit(config.provider)}
            className="text-gray-300 hover:text-white cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(config.provider)}
            className="text-red-500 hover:text-red-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 text-[10px] sm:text-xs xl:text-sm text-gray-400">
        <p>Models: {models.length}</p>
        <p>Used: {currency(totalCost)}</p>
        <p>
          Left: <span className="font-semibold text-gray-200">{currency(creditLeft)}</span>
        </p>
      </div>
    </div>
  );
}

// -----------------------------
// MAIN PAGE
// -----------------------------
export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  const [providers, setProviders] = useState<ProviderTemplate[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
  const [models, setModels] = useState<ModelType[]>([]);

  // Add provider
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [initialCredit, setInitialCredit] = useState(0);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [editingModels, setEditingModels] = useState<ModelType[]>([]);
  const [editingApiKey, setEditingApiKey] = useState("");
  const [editingCredit, setEditingCredit] = useState<{
    provider: string;
    credit: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        fetch("/api/providers"),
        fetch("/api/provider-configs"),
        fetch("/api/modals"),
      ]);

      const p = await pRes.json();
      const c = await cRes.json();
      const m = await mRes.json();

      setProviders(p.providers || []);
      setProviderConfigs(c.configs || []);
      setModels(m.modals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save Provider
  const handleSaveProvider = async () => {
    if (!selectedProvider || !apiKey) return;
    setSaving(true);

    try {
      await fetch("/api/provider-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey,
          credit: initialCredit,
        }),
      });

      const template = providers.find((p) => p.name === selectedProvider);
      if (template) {
        for (const model of template.availableModels) {
          await fetch("/api/modals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: selectedProvider,
              modelId: model.id,
              name: model.name,
              apiEndpoint: template.defaultEndpoint,
              requestType: template.defaultRequestType,
              headers: template.headerTemplate,
              responsePath: template.defaultResponsePath,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async (provider: string) => {
    if (!confirm("Delete provider and its models?")) return;

    await fetch(`/api/provider-configs?provider=${provider}`, {
      method: "DELETE",
    });

    const providerModels = models.filter((m) => m.provider === provider);
    for (const modal of providerModels) {
      await fetch(`/api/modals?id=${modal._id}`, {
        method: "DELETE",
      });
    }

    fetchData();
  };

  const handleEditProvider = (provider: string) => {
    const providerModels = models.filter((m) => m.provider === provider);
    setEditingModels(
      providerModels.map((m) => ({
        ...m,
        inputPricePerMillion: m.inputPricePerMillion ?? 0,
        outputPricePerMillion: m.outputPricePerMillion ?? 0,
      }))
    );

    setEditingProvider(provider);
    setEditingApiKey("");
    setEditingCredit({
      provider,
      credit: providerConfigs.find((p) => p.provider === provider)?.credit ?? 0,
    });
  };

  const handleSaveEditProvider = async () => {
    if (!editingProvider) return;
    setSaving(true);

    try {
      if (editingApiKey) {
        await fetch("/api/provider-configs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: editingProvider,
            api_key: editingApiKey,
          }),
        });
      }

      if (editingCredit) {
        await fetch("/api/provider-configs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingCredit),
        });
      }

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
    } finally {
      setSaving(false);
    }
  };

  const handleModelPriceChange = (
    id: string,
    input: number,
    output: number
  ) => {
    setEditingModels((prev) =>
      prev.map((m) =>
        m._id === id
          ? {
              ...m,
              inputPricePerMillion: input,
              outputPricePerMillion: output,
            }
          : m
      )
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-900 p-4 text-white">
      <div className="flex justify-end mb-4">
        <SideMenu />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Add Provider */}
        <div className="bg-zinc-800 p-6 rounded-lg shadow">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-700 text-white text-xs sm:text-sm xl:text-base outline-none"
            >
              <option value="">Choose Provider</option>
              {providers
                .filter((p) => !providerConfigs.find((c) => c.provider === p.name))
                .map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
            </select>

            {selectedProvider && (
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                className="px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-700 text-white placeholder-gray-400 text-xs sm:text-sm xl:text-base outline-none"
              />
            )}

            {selectedProvider && (
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCredit}
                onChange={(e) =>
                  setInitialCredit(parseFloat(e.target.value) || 0)
                }
                placeholder="Credit $"
                className="px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-700 text-white placeholder-gray-400 text-xs sm:text-sm xl:text-base outline-none"
              />
            )}
          </div>

          {selectedProvider && (
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setSelectedProvider("");
                  setApiKey("");
                  setInitialCredit(0);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs sm:text-sm xl:text-base cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={!apiKey || saving}
                onClick={handleSaveProvider}
                className="px-6 py-2 bg-black text-white border border-zinc-700 rounded-lg flex gap-2 items-center text-xs sm:text-sm xl:text-base cursor-pointer hover:bg-zinc-900"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Provider Grid */}
        {providerConfigs.length === 0 ? (
          <div className="p-8 text-center bg-zinc-800 rounded-lg shadow">
            <p className="text-xs sm:text-sm xl:text-base text-gray-400">No providers added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providerConfigs.map((config) => (
              <ProviderCard
                key={config.provider}
                config={config}
                models={models.filter((m) => m.provider === config.provider)}
                onEdit={handleEditProvider}
                onDelete={handleDeleteProvider}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Provider Modal */}
      {editingProvider && (
        <ModalShell
          title={`Edit Provider - ${editingProvider}`}
          onClose={() => setEditingProvider(null)}
          footer={
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 text-xs sm:text-sm xl:text-base rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEditProvider}
                disabled={saving}
                className="px-6 py-2 text-xs sm:text-sm xl:text-base bg-black border border-zinc-700 text-white rounded-lg flex gap-2 items-center cursor-pointer hover:bg-zinc-900"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-6 text-xs sm:text-sm xl:text-base">

            {/* API Key */}
            <div>
              <h4 className="font-semibold mb-2 text-xs sm:text-sm xl:text-lg flex items-center gap-2 text-white">
                <Key className="w-5 h-5" /> API Key
              </h4>

              <input
                type="password"
                value={editingApiKey}
                onChange={(e) => setEditingApiKey(e.target.value)}
                placeholder="Leave empty to keep existing"
                className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-700 text-white placeholder-gray-400 text-xs sm:text-sm xl:text-base"
              />
            </div>

            {/* Credit */}
            <div>
              <h4 className="font-semibold mb-2 text-xs sm:text-sm xl:text-lg text-white">
                Credit
              </h4>

              <input
                type="number"
                step="0.01"
                value={editingCredit?.credit ?? 0}
                onChange={(e) =>
                  setEditingCredit({
                    provider: editingProvider,
                    credit: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-700 text-white text-xs sm:text-sm xl:text-base"
              />
            </div>

            {/* Models */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm xl:text-lg text-white">
                Model Pricing
              </h4>

              {editingModels.map((m) => (
                <ModelPriceRow
                  key={m._id}
                  model={m}
                  onChange={handleModelPriceChange}
                />
              ))}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}