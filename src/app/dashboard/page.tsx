"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, ThumbsUp, ThumbsDown, Copy, ImagePlus, X, Search, SendHorizontal } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Import the reusable menu component
import SideMenu from "../components/SideMenu"; // Adjust this path if needed

interface Modal {
    _id: string;
    name: string;
    provider: string;
    modelId: string;
    status: "active" | "inactive";
    apiEndpoint: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    headers?: Record<string, string>;
    responsePath?: string;
    requestType?: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
    feedback?: 'like' | 'dislike' | null; // User feedback on assistant responses
    image?: string; // Base64 encoded image for user messages
    tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCost: number;
        isEstimated?: boolean;
    };
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
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<{ [key: string]: Message[] }>({});
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [isExpanded, setIsExpanded] = useState(false);
    // Chat session management
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // CSS for the black/dark scrollbar
    const scrollbarStyles = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #52525b; /* zinc-600 */
            border-radius: 10px;
        }
        /* Firefox fallback */
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #52525b transparent;
        }
    `;

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;

        // Reset height to auto to correctly calculate scrollHeight
        el.style.height = "auto";
        
        // Define max height (approx 3 lines + padding is roughly 90-100px)
        const maxHeight = 100; 

        if (el.scrollHeight > maxHeight) {
            // If content is taller than max, cap it and show scrollbar
            el.style.height = `${maxHeight}px`;
            el.style.overflowY = "auto";
        } else {
            // Otherwise, let it grow and hide scrollbar
            el.style.height = `${el.scrollHeight}px`;
            el.style.overflowY = "hidden";
        }

        setIsExpanded(el.scrollHeight > el.clientHeight);
    };

    useEffect(() => {
        const initializeDashboard = async () => {
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

                    // Remove messages for deactivated modals to keep state clean
                    const activeModalIds = new Set(activeModals.map((m: Modal) => m._id));
                    Object.keys(updated).forEach(modalId => {
                        if (!activeModalIds.has(modalId)) {
                            delete updated[modalId];
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
            image: uploadedImage || undefined,
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
        const currentImage = uploadedImage;
        setInputValue("");
        setUploadedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsSending(true);

        // Reset textarea height after sending
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.overflowY = 'hidden';
            setIsExpanded(false);
        }

        setTimeout(() => {
            modals.forEach((modal) => scrollToBottom(modal._id));
        }, 100);

        const promises = modals.map(async (modal) => {
            try {
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
                        image: currentImage,
                        apiEndpoint: modal.apiEndpoint,
                        provider: modal.provider,
                        modelId: modal.modelId,
                        headers: modal.headers,
                        responsePath: modal.responsePath,
                        conversationHistory: conversationHistory, // Send full chat history
                        sessionId: activeSessionId, // Send session ID for token tracking
                        webSearchEnabled: webSearchEnabled, // Send search preference
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const assistantMessage: Message = {
                        role: "assistant",
                        content: data.response,
                        timestamp: new Date(),
                        tokenUsage: data.tokenUsage // Store token usage from API
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

    // Handle image file selection
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size should be less than 5MB");
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert("Please upload a valid image file");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setUploadedImage(base64String);
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove uploaded image
    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Trigger file input click
    const triggerImageUpload = () => {
        fileInputRef.current?.click();
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

    // Get provider logo based on provider name
    const getProviderLogo = (provider: string) => {
        const providerLower = provider.toLowerCase();
        const logoMap: { [key: string]: string } = {
            'openai': '/logo/openai.png',
            'anthropic': '/logo/anthropic.png',
            'google': '/logo/google.png',
            'deepseek': '/logo/deepseek.png',
            'perplexity ai': '/logo/perplexityai.png',
            'zhipu ai': '/logo/zhipuai.png',
            'moonshot ai': '/logo/moonshotai.png',
            'mistral ai': '/logo/mistralai.png'
        };
        return logoMap[providerLower] || null;
    };

    return (
        <div className="flex h-screen justify-center bg-zinc-900 font-sans text-white">
            <div className="w-full items-start relative">
                {/* Floating Hamburger Menu - Top Right */}
                <div className="absolute top-2 right-2 z-30">
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

                <div className="w-full h-5/6 flex flex-row">

                    {/* Scrollable chat section */}
                    <div
                        className="w-full h-full bg-black flex space-x-1 border-b border-zinc-700 overflow-x-auto horizontal-scrollbar"
                    >
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <p className="text-xs sm:text-sm xl:text-base">Loading AI modals...</p>
                            </div>
                        ) : modals.length > 0 ? (
                            modals.map((modal) => {
                                // Calculate dynamic width based on number of modals
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
                                        className={`${getModalWidthClass()} min-w-[400px] h-full border-r border-zinc-700 bg-zinc-800 flex-shrink-0 flex flex-col`}
                                    >
                                        {/* Modal Header */}
                                        <div className="p-3 border-b border-zinc-700 bg-zinc-900">
                                            <div className="flex items-center gap-2">
                                                {getProviderLogo(modal.provider) ? (
                                                    <img
                                                        src={getProviderLogo(modal.provider)!}
                                                        alt={modal.provider}
                                                        className="h-6 w-6 object-contain rounded"
                                                    />
                                                ) : (
                                                    <Bot className="h-5 w-5 text-blue-400" />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-100 text-sm sm:text-lg xl:text-xl">
                                                        {modal.name}
                                                    </h3>
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
                                                            className={`max-w-[95%] rounded-lg px-3 py-2 text-xs sm:text-sm xl:text-base ${msg.role === "user"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-zinc-700 text-gray-100"
                                                                }`}
                                                        >
                                                            {msg.role === "user" ? (
                                                                <>
                                                                    {msg.image && (
                                                                        <img
                                                                            src={msg.image}
                                                                            alt="Uploaded"
                                                                            className="max-w-full rounded mb-2 max-h-60 object-contain"
                                                                        />
                                                                    )}
                                                                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                                                                </>
                                                            ) : (
                                                                <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-table:my-2">
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {msg.content}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Copy button for user messages */}
                                                        {msg.role === "user" && (
                                                            <div className="flex gap-1 mt-1 mr-2">
                                                                <button
                                                                    onClick={() => copyResponseToClipboard(msg.content)}
                                                                    className="p-1 rounded hover:bg-zinc-600 transition-colors text-gray-500"
                                                                    title="Copy message"
                                                                >
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Like/Dislike buttons for assistant messages */}
                                                        {msg.role === "assistant" && (
                                                            <div className="flex flex-col gap-1 mt-1 ml-2">
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleFeedback(modal._id, idx, 'like')}
                                                                        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${msg.feedback === 'like'
                                                                            ? 'text-blue-400'
                                                                            : 'text-gray-500'
                                                                            }`}
                                                                        title="Like this response"
                                                                    >
                                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleFeedback(modal._id, idx, 'dislike')}
                                                                        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${msg.feedback === 'dislike'
                                                                            ? 'text-red-400'
                                                                            : 'text-gray-500'
                                                                            }`}
                                                                        title="Dislike this response"
                                                                    >
                                                                        <ThumbsDown className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => copyResponseToClipboard(msg.content)}
                                                                        className="p-1 rounded hover:bg-zinc-600 transition-colors text-gray-500"
                                                                        title="Copy response"
                                                                    >
                                                                        <Copy className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-gray-500 text-[10px] sm:text-xs xl:text-sm">
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
                                <p className="mb-2 text-xs sm:text-sm xl:text-lg">No active AI modals</p>
                                <p className="text-[10px] sm:text-xs xl:text-sm">Enable modals from the menu or add new ones in your profile</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* Bottom input bar */}
                <div className="w-full h-1/6 bg-black p-3 sm:p-4 md:p-6 justify-center flex items-center border-t border-zinc-700">
                    <div className="w-full max-w-4xl flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                        {/* Image Preview - Compact thumbnail */}
                        {imagePreview && (
                            <div className="relative flex-shrink-0">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-md border-2 border-blue-500 object-cover"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-all shadow-lg"
                                    title="Remove image"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        {/* Web Search toggle button */}
                        <button
                            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                            disabled={isSending || modals.length === 0}
                            className={`p-2 sm:p-3 rounded-full transition-all flex-shrink-0 cursor-pointer ${webSearchEnabled
                                ? 'bg-blue-800 text-white'
                                : 'bg-[#38343a] text-white'
                                } disabled:bg-zinc-700 disabled:cursor-not-allowed`}
                            title={webSearchEnabled ? "Web search on" : "Web search off"}
                        >
                            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>

                        {/* Image upload button */}
                        <button
                            onClick={triggerImageUpload}
                            disabled={isSending || modals.length === 0}
                            className="p-2 sm:p-3 rounded-full bg-[#38343a] text-white hover:bg-[#4a4750] disabled:bg-zinc-700 cursor-pointer transition-all flex-shrink-0"
                            title="Upload image"
                        >
                            <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>

                        <style>{scrollbarStyles}</style>

                        <textarea
                            ref={textareaRef}
                            className={`flex-1 min-w-0 py-2 px-4 sm:py-3 sm:px-6 
                                border border-zinc-600 
                                bg-zinc-800 
                                text-white 
                                text-xs sm:text-sm xl:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 
                                transition-all duration-150 custom-scrollbar
                                ${isExpanded ? "rounded-xl" : "rounded-full"}`}

                            placeholder={
                                modals.length > 0
                                    ? `Send to ${modals.length} AI modal${modals.length > 1 ? "s" : ""}...`
                                    : "No active modals..."
                            }

                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                autoGrow();
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleKeyPress(e as any);
                                }
                                if (e.key === "Enter" && e.shiftKey) {
                                    e.preventDefault();
                                    setInputValue((prev) => prev + "\n");
                                    // Trigger autoGrow after state update
                                    setTimeout(autoGrow, 0);
                                }
                            }}

                            disabled={isSending || modals.length === 0}
                            rows={1}
                            style={{ 
                                maxHeight: "100px", 
                                overflowY: "hidden",
                                resize: "none"
                            }}
                        />

                        <button
                            onClick={sendToAllModals}
                            disabled={isSending || !inputValue.trim() || modals.length === 0}
                            className="p-2 sm:p-3 rounded-full bg-[#4a4750] text-white hover:bg-[#5a5760] cursor-pointer transition-all flex-shrink-0 disabled:bg-zinc-700 disabled:cursor-not-allowed"
                            title="Send message"
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                            ) : (
                                <SendHorizontal  className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}