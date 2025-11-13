"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Send, Loader2, ThumbsUp, ThumbsDown,Copy } from "lucide-react";

// Import the reusable menu component
import SideMenu from "../components/SideMenu"; // Adjust this path if needed

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
    feedback?: 'like' | 'dislike' | null; // User feedback on assistant responses
}

interface ChatSession {
    _id?: string;
    id?: string;
    title: string;
    createdAt: Date;
    lastMessageAt: Date;
    messages: { [key: string]: Message[] }; // Messages per modal
}

export default function DashboardPage() {
    const router = useRouter();
    const [modals, setModals] = useState<Modal[]>([]);
    const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<{ [key: string]: Message[] }>({});
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const chatRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Chat session management
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // All hamburger state and logic has been removed from here

    useEffect(() => {
        const initializeDashboard = async () => {
            await fetchProviderConfigs();
            await loadSessions(); // Load sessions first
            await fetchModals(); // Then fetch modals (won't overwrite session messages)
        };

        initializeDashboard();
    }, []);

    // Load sessions from database
    const loadSessions = async () => {
        try {
            console.log('Loading sessions from database...');
            const res = await fetch('/api/chat-sessions');
            const data = await res.json();

            if (data.success && data.sessions) {
                console.log('Loaded sessions:', data.sessions.length);

                // Convert date strings back to Date objects and normalize IDs
                const sessionsWithDates = data.sessions.map((s: any) => ({
                    ...s,
                    id: s._id, // Use _id as id for compatibility
                    createdAt: new Date(s.createdAt),
                    lastMessageAt: new Date(s.lastMessageAt),
                }));
                setSessions(sessionsWithDates);

                // Load the last active session
                const lastActiveId = localStorage.getItem('lastActiveSessionId');
                const matchingSession = sessionsWithDates.find((s: ChatSession) => s._id === lastActiveId);

                if (lastActiveId && matchingSession) {
                    console.log('Loading last active session:', lastActiveId);
                    setActiveSessionId(lastActiveId);
                    const messages = matchingSession.messages || {};
                    console.log('Session messages:', Object.keys(messages).length, 'modals');
                    setChatMessages(messages);
                } else if (sessionsWithDates.length > 0) {
                    // Use the most recent session
                    const mostRecent = sessionsWithDates[0];
                    console.log('Loading most recent session:', mostRecent._id);
                    setActiveSessionId(mostRecent._id);
                    setChatMessages(mostRecent.messages || {});
                    localStorage.setItem('lastActiveSessionId', mostRecent._id);
                } else {
                    // Create initial session if none exist
                    console.log('No sessions found, creating new one');
                    await createNewSession();
                }
            } else {
                // Create initial session
                console.log('No sessions in response, creating new one');
                await createNewSession();
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            await createNewSession();
        }
    };

    // Create a new chat session
    const createNewSession = async () => {
        try {
            console.log('Creating new session...');
            const res = await fetch('/api/chat-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const data = await res.json();
            if (data.success && data.session) {
                console.log('New session created:', data.session._id);
                const newSession = {
                    ...data.session,
                    id: data.session._id,
                    createdAt: new Date(data.session.createdAt),
                    lastMessageAt: new Date(data.session.lastMessageAt),
                };

                // Add to sessions list at the beginning (most recent first)
                const updatedSessions = [newSession, ...sessions];
                setSessions(updatedSessions);
                setActiveSessionId(newSession._id!);
                setChatMessages({});
                localStorage.setItem('lastActiveSessionId', newSession._id!);
                console.log('Session added to list. Total sessions:', updatedSessions.length);
            } else {
                console.error('Failed to create session:', data.error);
            }
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    // Switch to a different session
    const switchSession = (sessionId: string) => {
        const session = sessions.find(s => s._id === sessionId || s.id === sessionId);
        if (session) {
            const id = session._id || session.id;
            setActiveSessionId(id!);
            setChatMessages(session.messages || {});
            localStorage.setItem('lastActiveSessionId', id!);
        }
    };

    // Delete a session
    const deleteSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/chat-sessions?_id=${sessionId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const updatedSessions = sessions.filter(s => s._id !== sessionId && s.id !== sessionId);
                setSessions(updatedSessions);

                if (activeSessionId === sessionId) {
                    if (updatedSessions.length > 0) {
                        switchSession(updatedSessions[0]._id || updatedSessions[0].id!);
                    } else {
                        await createNewSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    // Update session title
    const updateSessionTitle = async (sessionId: string, newTitle: string) => {
        try {
            const res = await fetch('/api/chat-sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: sessionId, title: newTitle }),
            });

            if (res.ok) {
                const updatedSessions = sessions.map(s =>
                    (s._id === sessionId || s.id === sessionId) ? { ...s, title: newTitle } : s
                );
                setSessions(updatedSessions);
            }
        } catch (error) {
            console.error('Error updating session title:', error);
        }
    };

    // Save current session messages to database
    const saveCurrentSession = async (messages: { [key: string]: Message[] }) => {
        if (!activeSessionId) {
            console.warn('Cannot save session: No active session ID');
            return;
        }

        try {
            setIsSaving(true);
            console.log('Saving session:', activeSessionId, 'with messages for', Object.keys(messages).length, 'modals');

            // Optimistically update local state
            const updatedSessions = sessions.map(s =>
                (s._id === activeSessionId || s.id === activeSessionId)
                    ? { ...s, messages, lastMessageAt: new Date() }
                    : s
            );
            setSessions(updatedSessions);

            // Save to database
            const response = await fetch('/api/chat-sessions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: activeSessionId, messages }),
            });

            const result = await response.json();
            if (!result.success) {
                console.error('Failed to save session:', result.error);
            } else {
                console.log('✅ Session saved successfully');
            }
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setIsSaving(false);
        }
    };

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
                // Filter only active modals for the chat UI
                const activeModals = data.modals.filter((m: Modal) => m.status === "active");
                setModals(activeModals);

                // Don't overwrite existing messages - keep them from the loaded session
                // Only initialize messages for NEW modals that don't have messages yet
                setChatMessages(prev => {
                    const updated = { ...prev };
                    activeModals.forEach((modal: Modal) => {
                        // Only initialize if this modal doesn't have messages yet
                        if (!updated[modal._id]) {
                            updated[modal._id] = [];
                        }
                    });
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching modals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModalUpdate = () => {
        // Callback function to refresh modals when status changes in SideMenu
        fetchModals();
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

        const updatedMessages: { [key: string]: Message[] } = {};
        modals.forEach((modal) => {
            updatedMessages[modal._id] = [
                ...(chatMessages[modal._id] || []),
                userMessage,
            ];
        });
        setChatMessages(updatedMessages);
        saveCurrentSession(updatedMessages); // Save after user message

        const currentInput = inputValue;
        setInputValue("");
        setIsSending(true);

        setTimeout(() => {
            modals.forEach((modal) => scrollToBottom(modal._id));
        }, 100);

        const promises = modals.map(async (modal) => {
            try {
                const providerConfig = providerConfigs.find(c => c.provider === modal.provider);
                if (!providerConfig) {
                    throw new Error(`No API key configured for ${modal.provider}`);
                }

                // Get conversation history for this specific modal (exclude the current user message)
                const conversationHistory = (chatMessages[modal._id] || []).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

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
                        conversationHistory: conversationHistory, // Send full chat history
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const assistantMessage: Message = {
                        role: "assistant",
                        content: data.response,
                        timestamp: new Date(),
                    };

                    setChatMessages((prev) => {
                        const updated = {
                            ...prev,
                            [modal._id]: [...(prev[modal._id] || []), assistantMessage],
                        };
                        saveCurrentSession(updated); // Save after AI response
                        return updated;
                    });

                    setTimeout(() => scrollToBottom(modal._id), 100);
                } else {
                    const errorMessage: Message = {
                        role: "assistant",
                        content: `Error: ${data.error || "Failed to get response"}`,
                        timestamp: new Date(),
                    };
                    setChatMessages((prev) => {
                        const updated = {
                            ...prev,
                            [modal._id]: [...(prev[modal._id] || []), errorMessage],
                        };
                        saveCurrentSession(updated);
                        return updated;
                    });
                }
            } catch (error) {
                console.error(`Error sending to ${modal.name}:`, error);
                const errorMessage: Message = {
                    role: "assistant",
                    content: "Error: Failed to connect to AI service",
                    timestamp: new Date(),
                };
                setChatMessages((prev) => {
                    const updated = {
                        ...prev,
                        [modal._id]: [...(prev[modal._id] || []), errorMessage],
                    };
                    saveCurrentSession(updated);
                    return updated;
                });
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

    // Handle like/dislike feedback
    const handleFeedback = async (modalId: string, messageIndex: number, feedback: 'like' | 'dislike') => {
        // Update local state
        setChatMessages(prev => {
            const updated = { ...prev };
            const messages = [...(updated[modalId] || [])];

            if (messages[messageIndex]) {
                // Toggle feedback: if same feedback clicked, remove it; otherwise set new feedback
                messages[messageIndex] = {
                    ...messages[messageIndex],
                    feedback: messages[messageIndex].feedback === feedback ? null : feedback
                };
            }

            updated[modalId] = messages;

            // Save to database
            saveCurrentSession(updated);

            return updated;
        });
    };

    const copyResponseToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Response copied to clipboard!");
        });
    };

    // toggleModalStatus, navigateToProfile, and handleLogout have been REMOVED

    return (
        <div className="flex h-screen justify-center bg-gray-100 dark:bg-zinc-900 font-sans">
            <div className="w-full items-start">
                <div className="w-full h-5/6 flex flex-row">

                    {/* Scrollable chat section */}
                    <div
                        className="flex-1 h-full bg-black flex space-x-1 border-b border-gray-300 dark:border-gray-600 overflow-x-auto horizontal-scrollbar"
                    >
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <p>Loading AI modals...</p>
                            </div>
                        ) : modals.length > 0 ? (
                            modals.map((modal) => {
                                // Calculate dynamic width based on number of modals
                                // If modals can fit without scrolling, expand them to fill the screen
                                const getModalWidthClass = () => {
                                    const modalCount = modals.length;
                                    if (modalCount === 1) return "w-full";
                                    if (modalCount === 2) return "w-1/2";
                                    if (modalCount === 3) return "w-1/3";
                                    // For 4 or more modals, use min-width and allow scrolling
                                    return "w-1/4";
                                };

                                return (
                                    <div
                                        key={modal._id}
                                        className={`${getModalWidthClass()} min-w-[400px] h-full border-r border-gray-300 bg-white dark:bg-zinc-800 flex-shrink-0 flex flex-col`}
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
                                                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${msg.role === "user"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                                                                }`}
                                                        >
                                                            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                                        </div>

                                                        {/* Like/Dislike buttons for assistant messages */}
                                                        {msg.role === "assistant" && (
                                                            <div className="flex gap-1 mt-1 ml-2">
                                                                <button
                                                                    onClick={() => handleFeedback(modal._id, idx, 'like')}
                                                                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors ${msg.feedback === 'like'
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-gray-400 dark:text-gray-500'
                                                                        }`}
                                                                    title="Like this response"
                                                                >
                                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFeedback(modal._id, idx, 'dislike')}
                                                                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors ${msg.feedback === 'dislike'
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : 'text-gray-400 dark:text-gray-500'
                                                                        }`}
                                                                    title="Dislike this response"
                                                                >
                                                                    <ThumbsDown className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => copyResponseToClipboard(msg.content)}
                                                                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors ${msg.feedback === 'dislike'
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : 'text-gray-400 dark:text-gray-500'
                                                                        }`}
                                                                    title="Copy response"
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                                                    <p>Start chatting with {modal.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Bot className="h-16 w-16 mb-4 text-gray-500" />
                                <p className="text-lg mb-2">No active AI modals</p>
                                <p className="text-sm">Enable modals from the menu or add new ones in your profile</p>
                            </div>
                        )}
                    </div>

                    {/* Menu Button Area */}
                    <div className="w-16 h-full p-2 bg-white dark:bg-zinc-800 border-b border-l border-gray-300 dark:border-gray-600 flex items-start justify-center">
                        {/* All the hamburger button, side drawer, and overlay logic
                          is now handled by this single component.
                        */}
                        <SideMenu
                            onModalUpdate={handleModalUpdate}
                            sessions={sessions}
                            activeSessionId={activeSessionId}
                            onCreateSession={createNewSession}
                            onSwitchSession={switchSession}
                            onDeleteSession={deleteSession}
                            onUpdateSessionTitle={updateSessionTitle}
                        />
                    </div>

                </div>

                {/* Bottom input bar */}
                <div className="w-full h-1/6 bg-black p-6 justify-center flex items-center border-t border-gray-300 dark:border-gray-600">
                    <div className="w-full max-w-4xl flex items-center gap-3">
                        {isSaving && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                Saving...
                            </div>
                        )}
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