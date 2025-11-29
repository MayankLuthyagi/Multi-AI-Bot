"use client";

import { useState } from "react";
import ProviderStats from "../components/ProviderStats";
import SideMenu from "../components/SideMenu"; // Adjust this path if needed
export default function Home() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#131111] font-sans">

            <div className="flex justify-end p-2">
                <SideMenu/>
            </div>
            {/* Provider Statistics Section */}
            <section className="max-w-7xl mx-auto px-4 pt-12 pb-4">
                <ProviderStats />
            </section>
        </div>
    );
}
