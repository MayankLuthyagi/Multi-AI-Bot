// app/components/SideMenu.tsx
"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, BarChart3, Menu, X, User, LogOut, MessageSquarePlus, Trash2, Edit2, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface Modal {
    _id: string;
    name: string;
    provider: string;
    status: "active" | "inactive";
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
}

interface ChatSession {
    _id?: string;
    id?: string;
    title: string;
    createdAt: Date;
    lastMessageAt: Date;
    messages: { [key: string]: Message[] };
}

interface SideMenuProps {
    onModalUpdate?: () => void;
    sessions?: ChatSession[];
    activeSessionId?: string | null;
    onCreateSession?: () => void;
    onSwitchSession?: (sessionId: string) => void;
    onDeleteSession?: (sessionId: string) => void;
    onUpdateSessionTitle?: (sessionId: string, newTitle: string) => void;
}

// Small helper component: Toggle to set all modals active/inactive
function AllToggleButton({ modals, onBulkUpdate }: { modals: Modal[]; onBulkUpdate: (newStatus: string) => Promise<void> }) {
    const allActive = modals.length > 0 && modals.every(m => m.status === 'active');

    const handleClick = async () => {
        const newStatus = allActive ? 'inactive' : 'active';
        await onBulkUpdate(newStatus);
    };

    return (
        <button
            onClick={handleClick}
            className={`flex-shrink-0 relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${allActive ? 'bg-[#131111] border-white border' : 'bg-zinc-400'}`}
            title={allActive ? 'Turn all models off' : 'Turn all models on'}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allActive ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
    );
}

export default function SideMenu({
    onModalUpdate,
    sessions = [],
    activeSessionId,
    onCreateSession,
    onSwitchSession,
    onDeleteSession,
    onUpdateSessionTitle
}: SideMenuProps) {
    const [openHamburger, setOpenHamburger] = useState(false);
    const [modals, setModals] = useState<Modal[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        // Fetch modals when menu is opened
        if (openHamburger) {
            fetchModals();
        }
    }, [openHamburger]);

    // Or fetch on initial load
    useEffect(() => {
        fetchModals();
    }, []);

    // Debug: Log sessions when they change
    useEffect(() => {
        console.log('SideMenu sessions updated:', sessions.length);
    }, [sessions]);

    const fetchModals = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/modals");
            const data = await res.json();
            if (data.success) {
                setModals(data.modals);
            }
        } catch (error) {
            console.error("Error fetching modals:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModalStatus = async (modalId: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            const res = await fetch("/api/modals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: modalId, status: newStatus }),
            });

            if (res.ok) {
                // Update local state immediately for responsive UI
                setModals(
                    modals.map((m) =>
                        m._id === modalId ? { ...m, status: newStatus } : m
                    )
                );
                // Trigger the parent component to refresh active modals
                if (onModalUpdate) {
                    onModalUpdate();
                }
            } else {
                console.error("Failed to toggle modal status");
                alert("Failed to update model status. Please try again.");
            }
        } catch (error) {
            console.error("Error toggling modal status:", error);
            alert("Error updating model status. Please try again.");
        }
    };

    const navigateToProfile = () => {
        setOpenHamburger(false);
        router.push("/profile");
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const startEditingSession = (sessionId: string, currentTitle: string) => {
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle);
    };

    const saveSessionTitle = (sessionId: string) => {
        if (editTitle.trim() && onUpdateSessionTitle) {
            onUpdateSessionTitle(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
        setEditTitle("");
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                onClick={() => setOpenHamburger(!openHamburger)}
            >
                {openHamburger ? (
                    <X className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                ) : (
                    <Menu className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                )}
            </button>

            {/* Side Drawer (Right) */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col
                ${openHamburger ? "translate-x-0" : "translate-x-full"}`}
            >
                                    
                {/* Default Actions */}
                <div className="p-2 border-b border-gray-200 dark:border-zinc-700 space-y-1 flex-shrink-0">
                   <a
                        href="/profile"
                        className="w-full flex items-center gap-1 text-left p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
                    >
                        <User className="h-3 w-3 text-gray-800 dark:text-gray-100" />
                        Profile
                    </a>               
                    <a
                        href="/stats"
                        className="w-full flex items-center gap-1 text-left p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
                    >
                        <BarChart3 className="h-3 w-3 text-gray-800 dark:text-gray-100" />
                        Stats
                    </a>
                    <a
                        href="/dashboard"
                        className="w-full flex items-center gap-1 text-left p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
                    >
                        <LayoutDashboard className="h-3 w-3 text-gray-800 dark:text-gray-100" />
                        Dashboard
                    </a>                
                    <button
                        onClick={() => setOpenHamburger(false)}
                        className="w-full flex items-center gap-1 text-left p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 cursor-pointer"
                    >
                        <X className="h-3 w-3 text-gray-800 dark:text-gray-100" />
                        Close
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-1 text-left p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer"
                    >
                        <LogOut className="h-3 w-3" />
                        Logout
                    </button>
                </div>
                {pathname === '/dashboard' && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Chat Sessions Section */}
                        <div className="p-4 flex-1 overflow-hidden flex flex-col border-b border-zinc-700">
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Chat History {sessions.length > 0 && (
                                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                            ({sessions.length})
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => {
                                        onCreateSession?.();
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#131111] text-white text-xs font-medium transition-colors cursor-pointer"
                                    title="New Chat"
                                >
                                    +
                                </button>
                            </div>

                            {sessions.length > 0 ? (
                                <div className="space-y-1 flex-1 overflow-y-auto pr-2 sidebar-scroll">
                                    {sessions.map((session) => {
                                        const sessionId = session._id || session.id || '';
                                        return (
                                            <div
                                                key={sessionId}
                                                className={`group relative p-2 rounded-md cursor-pointer transition-colors ${activeSessionId === sessionId
                                                    ? "bg-[#131111] border border-black"
                                                    : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                    }`}
                                            >
                                                {editingSessionId === sessionId ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={(e) => setEditTitle(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === "Enter") saveSessionTitle(sessionId);
                                                                if (e.key === "Escape") setEditingSessionId(null);
                                                            }}
                                                            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => saveSessionTitle(sessionId)}
                                                            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            onClick={() => onSwitchSession?.(sessionId)}
                                                            className="flex-1"
                                                        >
                                                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                                {session.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatDate(session.lastMessageAt)}
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingSession(sessionId, session.title);
                                                                }}
                                                                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600"
                                                                title="Rename"
                                                            >
                                                                <Edit2 className="h-3 w-3 text-gray-100 cursor-pointer" />
                                                            </button>
                                                            {sessions.length > 1 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("Delete this chat session?")) {
                                                                            onDeleteSession?.(sessionId);
                                                                        }
                                                                    }}
                                                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 cursor-pointer"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    No chat sessions yet
                                </div>
                            )}
                        </div>                        
                        {/* AI Modals Section */}
                        <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
                            {loading ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    Loading modals...
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1 max-h-70 overflow-y-auto pr-2 sidebar-scroll">
                                        {/* All Models Toggle */}
                                        <div
                                            className={`p-2 rounded-lg border-2 transition-all ${modals.length > 0 && modals.every(m => m.status === 'active')
                                                ? "border-black bg-[#131111]"
                                                : "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                            All Models
                                                        </div>
                                                    </div>
                                                </div>
                                                <AllToggleButton modals={modals} onBulkUpdate={async (newStatus: string) => {
                                                    // Call backend to set all statuses
                                                    try {
                                                        const res = await fetch('/api/modals', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ action: 'setAllStatus', status: newStatus })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            // Refresh modals list
                                                            fetchModals();
                                                            if (onModalUpdate) onModalUpdate();
                                                        } else {
                                                            alert('Failed to update all models: ' + (data.error || 'unknown'));
                                                        }
                                                    } catch (err) {
                                                        console.error('Bulk update failed', err);
                                                        alert('Bulk update failed');
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                        {modals.map((modal) => (
                                            <div
                                                key={modal._id}
                                                className={`p-2 rounded-lg border-2 transition-all ${modal.status === "active"
                                                    ? "border-black bg-[#131111]"
                                                    : "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                                {modal.name} ({modal.provider})
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleModalStatus(modal._id, modal.status)}
                                                        className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modal.status === "active"
                                                            ? "bg-[#131111] border-white border"
                                                            : "bg-zinc-400"
                                                            }`}
                                                        title={modal.status === "active" ? "Deactivate" : "Activate"}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${modal.status === "active" ? "translate-x-6" : "translate-x-1"
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                 )}
            </div>

            {/* Overlay */}
            {openHamburger && (
                <div
                    onClick={() => setOpenHamburger(false)}
                    className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
                ></div>
            )}
        </>
    );
}
