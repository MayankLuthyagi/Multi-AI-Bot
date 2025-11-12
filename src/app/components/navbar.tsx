"use client";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Modal {
    _id: string;
    name: string;
    provider: string;
    status: "active" | "inactive";
}

export default function Navbar() {
    const [openHamburger, setOpenHamburger] = useState(false);
    const [modals, setModals] = useState<Modal[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchModals();
    }, []);

    const fetchModals = async () => {
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
                setModals(modals.map(m =>
                    m._id === modalId ? { ...m, status: newStatus } : m
                ));
            }
        } catch (error) {
            console.error("Error toggling modal status:", error);
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

    return (
        <nav className="w-full p-4 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Dashboard
                </h1>

                {/* Hamburger Button */}
                <button
                    className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                    onClick={() => setOpenHamburger(!openHamburger)}
                >
                    {openHamburger ? (
                        <X className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                    )}
                </button>
            </div>

            {/* Side Drawer (Right) */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-zinc-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50
                ${openHamburger ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Menu
                    </h2>
                    <button
                        onClick={() => setOpenHamburger(false)}
                        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
                    >
                        <X className="h-6 w-6 text-gray-800 dark:text-gray-100" />
                    </button>
                </div>

                <div className="flex flex-col mt-4 space-y-2 px-4">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            Loading modals...
                        </div>
                    ) : modals.length > 0 ? (
                        <>
                            <div className="mb-2 pb-2 border-b border-gray-200 dark:border-zinc-700">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">
                                    AI Modals
                                </h3>
                            </div>
                            {modals.map((modal) => (
                                <div
                                    key={modal._id}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {modal.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {modal.provider}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleModalStatus(modal._id, modal.status)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modal.status === "active"
                                            ? "bg-green-600"
                                            : "bg-gray-300 dark:bg-zinc-600"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${modal.status === "active"
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                            <div className="my-2 border-t border-gray-200 dark:border-zinc-700"></div>
                        </>
                    ) : (
                        <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                            No modals available
                        </div>
                    )}

                    <button
                        onClick={navigateToProfile}
                        className="flex items-center gap-2 text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200"
                    >
                        <User className="h-5 w-5" />
                        Profile
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-left p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {openHamburger && (
                <div
                    onClick={() => setOpenHamburger(false)}
                    className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
                ></div>
            )}
        </nav>
    );
}
