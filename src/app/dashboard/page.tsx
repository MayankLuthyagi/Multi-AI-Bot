"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, Send, Loader2 } from "lucide-react";

interface Modal {
    _id: string;
    name: string;
    provider: string;
    modelId: string;
    status: "active" | "inactive";
    apiEndpoint: string;
    costPer1KTokens: number;
    headers?: Record<string, string>;
    responsePath?: string;
    requestType?: string;
}

interface ProviderConfig {
    _id: string;
    provider: string;
    api_key: string;
    credit: number;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
}

export default function DashboardPage() {
    const [modals, setModals] = useState<Modal[]>([]);
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<{ [key: string]: Message[] }>({});
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const chatRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        fetchModals();
        fetchProviderConfigs();
    }, []);

    const fetchProviderConfigs = async () => {
        try {
            const res = await fetch("/api/provider-configs");
            const data = await res.json();
            if (data.success) {
                setProviderConfigs(data.configs);
            }
        } catch (error) {
            console.error("Error fetching provider configs:", error);
        }
    };

    const fetchModals = async () => {
        try {
            const res = await fetch("/api/modals");
            const data = await res.json();
            if (data.success) {
                // Filter only active modals
                const activeModals = data.modals.filter((m: Modal) => m.status === "active");
                setModals(activeModals);

                // Initialize chat messages for each modal
                const initialMessages: { [key: string]: Message[] } = {};
                activeModals.forEach((modal: Modal) => {
                    initialMessages[modal._id] = [];
                });
                setChatMessages(initialMessages);
            }
        } catch (error) {
            console.error("Error fetching modals:", error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = (modalId: string) => {
        if (chatRefs.current[modalId]) {
            chatRefs.current[modalId]?.scrollTo({
                top: chatRefs.current[modalId]?.scrollHeight,
                behavior: "smooth",
            });
        }
    };

    const sendToAllModals = async () => {
        if (!inputValue.trim() || isSending || modals.length === 0) return;

        const userMessage: Message = {
            role: "user",
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        // Add user message to all modal chats
        const updatedMessages: { [key: string]: Message[] } = {};
        modals.forEach((modal) => {
            updatedMessages[modal._id] = [
                ...(chatMessages[modal._id] || []),
                userMessage,
            ];
        });
        setChatMessages(updatedMessages);

        // Clear input and set sending state
        const currentInput = inputValue;
        setInputValue("");
        setIsSending(true);

        // Scroll all chats to bottom
        setTimeout(() => {
            modals.forEach((modal) => scrollToBottom(modal._id));
        }, 100);

        // Send to all modals in parallel
        const promises = modals.map(async (modal) => {
            try {
                // Find the API key for this modal's provider
                const providerConfig = providerConfigs.find(c => c.provider === modal.provider);
                if (!providerConfig) {
                    throw new Error(`No API key configured for ${modal.provider}`);
                }

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        modalId: modal._id,
                        message: currentInput,
                        apiEndpoint: modal.apiEndpoint,
                        apiKey: providerConfig.api_key,
                        provider: modal.provider,
                        modelId: modal.modelId,
                        headers: modal.headers,
                        responsePath: modal.responsePath,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const assistantMessage: Message = {
                        role: "assistant",
                        content: data.response,
                        timestamp: new Date(),
                    };

                    setChatMessages((prev) => ({
                        ...prev,
                        [modal._id]: [...(prev[modal._id] || []), assistantMessage],
                    }));

                    setTimeout(() => scrollToBottom(modal._id), 100);
                } else {
                    // Error response
                    const errorMessage: Message = {
                        role: "assistant",
                        content: `Error: ${data.error || "Failed to get response"}`,
                        timestamp: new Date(),
                    };

                    setChatMessages((prev) => ({
                        ...prev,
                        [modal._id]: [...(prev[modal._id] || []), errorMessage],
                    }));
                }
            } catch (error) {
                console.error(`Error sending to ${modal.name}:`, error);
                const errorMessage: Message = {
                    role: "assistant",
                    content: "Error: Failed to connect to AI service",
                    timestamp: new Date(),
                };

                setChatMessages((prev) => ({
                    ...prev,
                    [modal._id]: [...(prev[modal._id] || []), errorMessage],
                }));
            }
        });

        await Promise.all(promises);
        setIsSending(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendToAllModals();
        }
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] justify-center bg-gray-100 dark:bg-zinc-900 font-sans">
            <div className="w-full items-start">
                {/* Scrollable section */}
                <div
                    className="w-full h-5/6 bg-black flex space-x-1 border-b border-gray-300 dark:border-gray-600 overflow-x-auto horizontal-scrollbar"
                >
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <p>Loading AI modals...</p>
                        </div>
                    ) : modals.length > 0 ? (
                        modals.map((modal) => (
                            <div
                                key={modal._id}
                                className="w-1/4 min-w-[400px] h-full border-r border-gray-300 bg-white dark:bg-zinc-800 flex-shrink-0 flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="p-3 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                {modal.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {modal.provider} • ${modal.costPer1KTokens.toFixed(4)}/1K
                                            </p>
                                        </div>
                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    </div>
                                </div>

                                {/* Chat Messages Area */}
                                <div
                                    ref={(el) => {
                                        chatRefs.current[modal._id] = el;
                                    }}
                                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}
                                >
                                    {chatMessages[modal._id]?.length > 0 ? (
                                        chatMessages[modal._id].map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${msg.role === "user"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                                        }`}
                                                >
                                                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                                            <p>Start chatting with {modal.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Bot className="h-16 w-16 mb-4 text-gray-500" />
                            <p className="text-lg mb-2">No active AI modals</p>
                            <p className="text-sm">Enable modals from the menu or add new ones in your profile</p>
                        </div>
                    )}
                </div>

                {/* Bottom input bar */}
                <div className="w-full h-1/6 bg-black p-6 justify-center flex items-center border-t border-gray-300 dark:border-gray-600">
                    <div className="w-full max-w-4xl flex items-center gap-3">
                        <input
                            className="flex-1 py-3 px-6 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="text"
                            placeholder={
                                modals.length > 0
                                    ? `Send to ${modals.length} active AI modal${modals.length > 1 ? "s" : ""}...`
                                    : "No active modals..."
                            }
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isSending || modals.length === 0}
                        />
                        <button
                            onClick={sendToAllModals}
                            disabled={isSending || !inputValue.trim() || modals.length === 0}
                            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                        >
                            {isSending ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <Send className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
