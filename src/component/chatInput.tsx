"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import "../style/index.css";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const pathname = usePathname();
  const { data: session } = useSession();

  // Check if we're on chat page with sidebar
  const isChatPage = pathname === "/chat";
  const shouldShowSidebar = isChatPage && session;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && onSendMessage) {
      onSendMessage(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`fixed bottom-0 right-0 bg-[#0D0D0D] text-white p-4 z-40 border-t border-gray-700 ${shouldShowSidebar ? 'left-64' : 'left-0'
      }`}>
      <div className="w-full max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="w-full p-4 pr-16 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[56px] max-h-32 text-white placeholder-gray-400"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '56px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />

          <button
            type="submit"
            disabled={!value.trim() || disabled}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${value.trim() && !disabled
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9 22,2" />
            </svg>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Multibot can make mistakes. Consider checking important information.</span>
          <span className="flex items-center space-x-2">
            {disabled && (
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1"></div>
                Thinking...
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};