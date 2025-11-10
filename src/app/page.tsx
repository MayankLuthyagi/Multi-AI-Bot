"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
                redirect: "follow",
            });

            if (res.redirected || res.ok) {
                router.push("/dashboard");
                return;
            }

            const data = await res.json().catch(() => null);
            setError(data?.error || "Invalid credentials");
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-zinc-900 font-sans">
            <main className="w-full max-w-md p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700">
                <h1 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100 text-center">
                    Sign in
                </h1>

                <form onSubmit={handleSubmit}>
                    <label className="block mb-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Name</span>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Your name"
                        />
                    </label>

                    <label className="block mb-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                    </label>

                    {error && (
                        <div className="text-red-600 dark:text-red-400 mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </main>
        </div>
    );
}
