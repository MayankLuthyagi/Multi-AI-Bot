"use client";

import { useState } from "react";
import Navbar from "../app/components/navbar";
import LoginModal from "../app/components/LoginModal";
import ProviderStats from "../app/components/ProviderStats";

export default function Home() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black font-sans">

            {/* Navbar with login trigger */}
            <Navbar onLoginClick={() => setIsLoginModalOpen(true)} />

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />

            {/* Provider Statistics Section */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                    Provider Usage & Credits
                </h2>
                <ProviderStats />
            </section>

            {/* More sections here */}
        </div>
    );
}
