"use client";
import Image from "next/image";

interface NavbarProps {
    onLoginClick?: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
    return (
        <nav className="w-full px-4 py-8 bg-black">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Left side: Logo + Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Multi-Bot
                    </h1>
                </div>

                {/* Right side: Login Button */}
                <button
                    onClick={onLoginClick}
                    className="px-4 py-2 bg-white text-gray-900 rounded-full transition font-semibold cursor-pointer"
                >
                    Login
                </button>
            </div>
        </nav>
    );
}
