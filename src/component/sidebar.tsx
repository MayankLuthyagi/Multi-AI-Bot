"use client";

import { useSession } from "next-auth/react";
import { useModel } from "../context/ModelContext";

export const Sidebar = () => {
  const { data: session } = useSession();
  const { models, selectedModels, toggleModel, isLoading } = useModel();

  if (!session) {
    return null;
  }

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] bg-[#0D0D0D] text-white p-4 hidden lg:block fixed top-16 left-0 z-40 overflow-y-auto">

      <div className="mb-6">
        <h3 className="text-md font-medium mb-1">Quick Actions</h3>
        <nav>
          <ul className="space-y-1">
            <li>
              <a
                href="/dashboard"
                className="block px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                💬 New Chat
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                📝 Chat History
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">AI Models</h2>
        <div className="text-sm text-blue-400 mb-3">
          {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
        </div>

        {isLoading ? (
          <div className="text-gray-400">Loading models...</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
              <div key={provider} className="border border-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-2">{provider}</h3>
                <div className="space-y-2">
                  {providerModels.map((model) => (
                    <label
                      key={model.id}
                      className="flex items-start space-x-2 cursor-pointer hover:bg-gray-800 rounded"
                    >

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">
                          {model.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {model.supportsImages && (
                            <span className="text-xs px-1.5 bg-green-600 text-white rounded">
                              Img
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.id)}
                        onChange={() => toggleModel(model.id)}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Logged in as <br />
          <span className="text-white">{session?.user?.email}</span>
        </div>
      </div>
    </aside>
  );
};
