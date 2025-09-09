"use client";
import React, { useState } from "react";
import "../style/index.css";

export const ChatInput = () => {
  const [value, setValue] = useState("");

  return (
    <div className="fixed bottom-0 w-full bg-[#0D0D0D] text-white p-4 z-40">
      <div className="w-full max-w-xl mx-auto relative">
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full p-2 pr-10 bg-transparent border border-gray-600 rounded-md focus:outline-none"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        {value && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            aria-label="Send"
          >
            <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 rounded-xl bg-[#1e1e1e] p-1"
            viewBox="0 0 24 24"
            >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
            </svg>

          </button>
        )}
      </div>
    </div>
  );
};