"use client";

import { useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    if (!isOpen) return null;

    // Local state inside modal
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Important for cookies
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data?.success) {
                window.location.href = "/dashboard";
                return;
            }

            setError(data?.error || "Invalid credentials");
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-white">
                <div className="flex justify-center"><h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Login to Your Account</h1></div>
                <form onSubmit={handleSubmit}>
                    <label className="block mb-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                        <input
                            required
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="you@example.com"
                        />
                    </label>

                    <label className="block mb-6">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Password</span>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                    </label>

                    {error && (
                        <div className="text-red-600 dark:text-red-400 mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="flex justify-between space-x-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-2 rounded-md font-medium transition-colors disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-gray-200 dark:bg-zinc-700 rounded-lg text-gray-900 dark:text-gray-100 cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
