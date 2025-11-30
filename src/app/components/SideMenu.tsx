// app/components/SideMenu.tsx
"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, BarChart3, Menu, X, User, LogOut, Trash2, Edit2, Check } from "lucide-react";
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
            className={`flex-shrink-0 relative inline-flex h-5 w-10 sm:h-6 sm:w-12 items-center rounded-full transition-colors ${allActive ? 'bg-[#131111] border-white border' : 'bg-zinc-600'}`}
            title={allActive ? 'Turn all models off' : 'Turn all models on'}
        >
            <span className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${allActive ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} />
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
                setModals(
                    modals.map((m) =>
                        m._id === modalId ? { ...m, status: newStatus } : m
                    )
                );
                if (onModalUpdate) {
                    onModalUpdate();
                }
            } else {
                alert("Failed to update model status. Please try again.");
            }
        } catch (error) {
            console.error("Error toggling modal status:", error);
            alert("Error updating model status. Please try again.");
        }
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
                className="p-2 rounded-md hover:bg-zinc-700 transition cursor-pointer text-white"
                onClick={() => setOpenHamburger(!openHamburger)}
            >
                {openHamburger ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Menu className="h-6 w-6" />
                )}
            </button>

            {/* Side Drawer (Right) */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-zinc-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col
                ${openHamburger ? "translate-x-0" : "translate-x-full"}`}
            >

                {/* Default Actions */}
                <div className="p-2 border-b border-zinc-700 space-y-2 flex-shrink-0 text-xs sm:text-sm xl:text-base">
                    <a
                        href="/profile"
                        className="w-full flex items-center gap-3 text-left p-1 rounded-lg hover:bg-zinc-700 text-white transition-colors"
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </a>
                    <a
                        href="/stats"
                        className="w-full flex items-center gap-3 text-left p-1 rounded-lg hover:bg-zinc-700 text-white transition-colors"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Stats
                    </a>
                    <a
                        href="/dashboard"
                        className="w-full flex items-center gap-3 text-left p-1 rounded-lg hover:bg-zinc-700 text-white transition-colors"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </a>
                    <button
                        onClick={() => setOpenHamburger(false)}
                        className="w-full flex items-center gap-3 text-left p-1 rounded-lg hover:bg-zinc-700 text-white cursor-pointer transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Close
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 text-left p-1 rounded-lg hover:bg-red-900/20 text-red-400 cursor-pointer transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>

                {pathname === '/dashboard' && (
                    <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
                        
                        {/* Chat Sessions Section - Takes 50% */}
                        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/30 rounded-xl border border-zinc-700 p-3 overflow-hidden">
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <h3 className="font-semibold text-gray-200 text-sm sm:text-lg xl:text-lg">
                                    History {sessions.length > 0 && (
                                        <span className="ml-1 text-[10px] sm:text-xs xl:text-sm text-zinc-500">
                                            ({sessions.length})
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={() => onCreateSession?.()}
                                    className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#131111] hover:bg-black text-white text-lg font-medium transition-colors cursor-pointer border border-zinc-600"
                                    title="New Chat"
                                >
                                    +
                                </button>
                            </div>

                            {sessions.length > 0 ? (
                                <div className="space-y-1 flex-1 overflow-y-auto pr-1 sidebar-scroll">
                                    {sessions.map((session) => {
                                        const sessionId = session._id || session.id || '';
                                        return (
                                            <div
                                                key={sessionId}
                                                className={`group relative p-2 rounded-lg cursor-pointer transition-all border ${activeSessionId === sessionId
                                                    ? "bg-[#131111] border-zinc-500 shadow-sm"
                                                    : "hover:bg-zinc-800 border-transparent"
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
                                                            className="flex-1 px-2 py-1 text-xs sm:text-sm xl:text-base bg-zinc-800 border border-zinc-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => saveSessionTitle(sessionId)}
                                                            className="p-1 rounded hover:bg-green-900/20 text-green-500"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            onClick={() => onSwitchSession?.(sessionId)}
                                                            className="flex-1"
                                                        >
                                                            <div className="font-medium text-white truncate text-xs sm:text-sm xl:text-base">
                                                                {session.title} {" "}
                                                                <span className="text-zinc-500 text-[10px] sm:text-xs xl:text-sm mt-0.5">
                                                                    ({formatDate(session.lastMessageAt)})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    startEditingSession(sessionId, session.title);
                                                                }}
                                                                className="p-1.5 rounded hover:bg-blue-900/20 text-blue-400"
                                                                title="Rename"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5 cursor-pointer" />
                                                            </button>
                                                            {sessions.length > 1 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm("Delete this chat session?")) {
                                                                            onDeleteSession?.(sessionId);
                                                                        }
                                                                    }}
                                                                    className="p-1.5 rounded hover:bg-red-900/20 text-red-400 cursor-pointer"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
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
                                <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs sm:text-sm xl:text-base">
                                    No chat sessions
                                </div>
                            )}
                        </div>

                        {/* AI Modals Section - Takes 50% */}
                        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/30 rounded-xl border border-zinc-700 p-3 overflow-hidden">
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs sm:text-sm xl:text-base">
                                    Loading modals...
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-1 sidebar-scroll space-y-2">
                                    {/* All Models Toggle (Now inside scroll) */}
                                    <div
                                        className={`p-2 rounded-lg border transition-all ${modals.length > 0 && modals.every(m => m.status === 'active')
                                            ? "border-zinc-500 bg-[#131111]"
                                            : "border-zinc-700 bg-zinc-800"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-white truncate text-xs sm:text-sm xl:text-base pl-1">
                                                All Models
                                            </div>
                                            <AllToggleButton modals={modals} onBulkUpdate={async (newStatus: string) => {
                                                try {
                                                    const res = await fetch('/api/modals', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ action: 'setAllStatus', status: newStatus })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        fetchModals();
                                                        if (onModalUpdate) onModalUpdate();
                                                    } else {
                                                        alert('Failed: ' + (data.error || 'unknown'));
                                                    }
                                                } catch (err) {
                                                    console.error('Bulk update failed', err);
                                                }
                                            }} />
                                        </div>
                                    </div>

                                    {/* Individual Models */}
                                    {modals.map((modal) => (
                                        <div
                                            key={modal._id}
                                            className={`p-2 rounded-lg border transition-all ${modal.status === "active"
                                                ? "border-zinc-500 bg-[#131111]"
                                                : "border-zinc-700 bg-zinc-800"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="font-medium text-white truncate text-xs sm:text-sm xl:text-base">
                                                        {modal.name}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs xl:text-sm text-zinc-500 truncate">
                                                        {modal.provider}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleModalStatus(modal._id, modal.status)}
                                                    className={`flex-shrink-0 relative inline-flex h-5 w-10 sm:h-6 sm:w-12 items-center rounded-full transition-colors ${modal.status === "active"
                                                        ? "bg-[#131111] border-white border"
                                                        : "bg-zinc-600"
                                                        }`}
                                                    title={modal.status === "active" ? "Deactivate" : "Activate"}
                                                >
                                                    <span
                                                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${modal.status === "active" ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay */}
            {openHamburger && (
                <div
                    onClick={() => setOpenHamburger(false)}
                    className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
                ></div>
            )}
        </>
    );
}