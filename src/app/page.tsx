"use client";

import { useState } from "react";
import Navbar from "./components/navbar";
import ProviderStats from "./components/ProviderStats";

export default function Home() {
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
                credentials: "include",
                body: JSON.stringify({ email, password }),
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
    <div className="min-h-screen bg-[#131111] font-sans text-white flex items-center justify-center px-4">
        
        <main className="w-full max-w-md">
            <section className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-lg backdrop-blur-sm">
                
                <h2 className="text-2xl font-semibold text-center mb-6">Sign in</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div>
                        <label className="text-sm text-gray-300">Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-[#0f0d0d] text-white p-3 outline-none focus:ring-2 focus:ring-white/20"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-[#0f0d0d] text-white p-3 outline-none focus:ring-2 focus:ring-white/20"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-white text-black rounded-lg font-medium disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setEmail(""); setPassword(""); setError(null); }}
                            className="px-4 py-2 bg-white/10 rounded-lg text-sm text-gray-300"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </section>
        </main>
    </div>
);

}
