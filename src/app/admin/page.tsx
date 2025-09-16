"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AIPlatform {
  id: string;
  name: string;
  apiKey: string;
  endpoint: string;
  isActive: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<AIPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<AIPlatform | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    apiKey: "",
    endpoint: "",
    isActive: true,
  });

  // Use session isAdmin property instead of hardcoded email
  const isAdmin = session?.user?.isAdmin || session?.user?.email === "mayankchandrajoshi@gmail.com";

  // Debug logging
  console.log('Admin page - session:', session);
  console.log('Admin page - isAdmin:', isAdmin);
  console.log('Admin page - session.user.isAdmin:', session?.user?.isAdmin);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch("/api/admin/models");
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && isAdmin) {
      fetchPlatforms();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingPlatform ? `/api/admin/models/${editingPlatform.id}` : "/api/admin/models";
      const method = editingPlatform ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPlatforms();
        setIsAddingPlatform(false);
        setEditingPlatform(null);
        setFormData({
          name: "",
          apiKey: "",
          endpoint: "",
          isActive: true,
        });
      }
    } catch (error) {
      console.error("Error saving platform:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (platform: AIPlatform) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      apiKey: platform.apiKey,
      endpoint: platform.endpoint,
      isActive: platform.isActive,
    });
    setIsAddingPlatform(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this platform?")) return;

    try {
      console.log('Attempting to delete platform with ID:', id);
      const response = await fetch(`/api/admin/models/${id}`, {
        method: "DELETE",
      });

      console.log('Delete response status:', response.status);
      if (response.ok) {
        console.log('Platform deleted successfully');
        await fetchPlatforms();
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`Failed to delete platform: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting platform:", error);
      alert('Error deleting platform. Check console for details.');
    }
  };

  const togglePlatformStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchPlatforms();
      }
    } catch (error) {
      console.error("Error toggling platform status:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600 mb-6">
            You don't have administrator privileges to access this page.
          </p>
          <div className="space-y-2">
            {!session ? (
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                <p>Signed in as: {session.user?.email}</p>
                <p className="mt-2">Contact an administrator to request access.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">AI Platforms Management</h1>
              <button
                onClick={() => setIsAddingPlatform(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Platform
              </button>
            </div>
          </div>

          {/* Platforms List */}
          <div className="p-6">
            {platforms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No AI platforms configured yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">{platform.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${platform.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}>
                            {platform.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Endpoint: {platform.endpoint}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => togglePlatformStatus(platform.id, platform.isActive)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${platform.isActive
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                        >
                          {platform.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleEdit(platform)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(platform.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 text-sm rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Platform Modal */}
        {isAddingPlatform && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">
                {editingPlatform ? "Edit Platform" : "Add New Platform"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="OpenAI, Anthropic, Google, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://api.openai.com/v1/chat/completions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter API key"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : editingPlatform ? "Update" : "Add Platform"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPlatform(false);
                      setEditingPlatform(null);
                      setFormData({
                        name: "",
                        apiKey: "",
                        endpoint: "",
                        isActive: true,
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}