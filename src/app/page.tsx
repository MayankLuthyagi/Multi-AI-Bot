"use client";

import { useState } from "react";
import Navbar from "../app/components/navbar";
import LoginModal from "../app/components/LoginModal";
import ProviderStats from "../app/components/ProviderStats";
export default function Home() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black font-sans">

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            {/* Provider Statistics Section */}
            <section className="max-w-7xl mx-auto px-4 pt-12 pb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                    Provider Usage & Credits
                </h2>
                <ProviderStats />
            </section>

            {/* Right side: Login Button */}
            <section className="flex justify-center mb-12">
                <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-8 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-lg border border-gray-600 hover:shadow-xl"
                >
                    Login
                </button>
            </section>
        </div>
    );
}
