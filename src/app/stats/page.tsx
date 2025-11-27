"use client";

import { useState } from "react";
import ProviderStats from "../components/ProviderStats";
export default function Home() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#131111] font-sans">


            {/* Provider Statistics Section */}
            <section className="max-w-7xl mx-auto px-4 pt-12 pb-4">
                <ProviderStats />
            </section>
        </div>
    );
}
