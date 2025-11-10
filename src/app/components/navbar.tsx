"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [openHamburger, setOpenHamburger] = useState(false);

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
                    <button className="text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700">
                        Settings
                    </button>
                    <button className="text-left p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700">
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
