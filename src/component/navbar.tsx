"use client";
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useModel } from "../context/ModelContext";

type NavbarProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Navbar = ({ open, setOpen }: NavbarProps) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { models, selectedModels, toggleModel, isLoading: isLoadingModels } = useModel();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const modelsByProvider = Array.isArray(models)
    ? models.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
      }, {} as Record<string, typeof models>)
    : {};

  return (
    <nav className="fixed top-0 w-full bg-gradient-to-r from-gray-950 to-black text-white px-4 py-3 z-50 border-b border-gray-800">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            className="w-8 h-8"
            src="https://chat.aifiesta.ai/static/images/logo/icon.png"
            alt="Multibot Logo"
          />
          <span className="ml-2 text-lg font-bold hidden sm:block">Multibot</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link
            href="/"
            className={`hover:text-emerald-400 transition-colors ${
              pathname === "/" ? "text-emerald-400" : "text-gray-300"
            }`}
          >
            Home
          </Link>
          {session && (
            <Link
              href="/chat"
              className={`hover:text-emerald-400 transition-colors ${
                pathname === "/chat" ? "text-emerald-400" : "text-gray-300"
              }`}
            >
              Chat
            </Link>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <>
                <span className="text-sm text-gray-400 hidden md:block">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-800 transition"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu"
            >
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      <div
        className={`fixed inset-0 z-[9999] bg-black bg-opacity-95 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          className="absolute top-6 right-6 text-white text-3xl hover:text-red-400 transition"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          &times;
        </button>

        <div className="flex flex-col items-center justify-center h-full gap-8 text-lg">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`hover:text-emerald-400 transition-colors ${
              pathname === "/" ? "text-emerald-400" : "text-gray-300"
            }`}
          >
            Home
          </Link>
          {session && (
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className={`hover:text-emerald-400 transition-colors ${
                pathname === "/chat" ? "text-emerald-400" : "text-gray-300"
              }`}
            >
              Chat
            </Link>
          )}

          {/* Quick Actions */}
          {session && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="hover:text-emerald-400 transition-colors"
            >
              ➕ Start Chat
            </Link>
          )}

          {/* Auth Mobile */}
          <div className="mt-6">
            {status === "loading" ? (
              <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            ) : session ? (
              <button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
