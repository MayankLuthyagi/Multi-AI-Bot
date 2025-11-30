"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
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
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#131111] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 
                bg-[#1a1818] border border-white/10 shadow-2xl rounded-xl overflow-hidden">

                {/* LEFT SIDE — LOGIN FORM */}
                <div className="p-6 flex flex-col justify-center text-white">

                    {/* Logo */}
                    <div className="mb-6 flex justify-center sm:justify-start">
                        <div className="w-40 bg-transparent rounded flex">
                            <Image
                                src="/logo/text-logo.png"
                                alt="Logo"
                                priority
                                width={240}
                                height={80}
                                className="object-contain"
                            />
                        </div>
                    </div>


                    <h1 className="flex text-3xl font-bold text-white mb-2 justify-center sm:justify-start">Welcome Back</h1>
                    <p className="text-gray-400 mb-8 text-center sm:text-left">
                        Please sign in to access your dashboard.
                    </p>


                    {/* LOGIN FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Email */}
                        <div>
                            <label className="text-sm text-gray-300">Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/20 
                                    bg-[#0f0d0d] text-white p-3 outline-none
                                    focus:ring-2 focus:ring-white/20"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm text-gray-300">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/20 
                                    bg-[#0f0d0d] text-white p-3 outline-none
                                    focus:ring-2 focus:ring-white/20"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-white text-black rounded-lg font-semibold 
                                shadow-md transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>


                    {/* Test credentials + quick-fill */}
                    <div className="mt-4 text-sm text-gray-400 text-center sm:text-left">
                        <div className="mb-2">Test credentials for quick sign in:</div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 justify-center sm:justify-start">
                            <div className="text-xs text-gray-300">Email: <span className="font-mono text-white">admin@example.com</span></div>
                            <div className="text-xs text-gray-300">Password: <span className="font-mono text-white">password</span></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE — IMAGE */}
                <div className="hidden md:block bg-[#0d0c0c] relative">
                    <Image
                        src="/logo/logo.png"
                        alt="Illustration"
                        fill
                        className="object-cover opacity-90"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
