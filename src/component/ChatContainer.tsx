"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChatInput } from "./chatInput";
import { useModel } from "../context/ModelContext";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    responses?: {
        modelId: string;
        modelName: string;
        provider: string;
        response: string;
        error: boolean;
    }[];
}

export const ChatContainer = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { selectedModels } = useModel();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        if (selectedModels.length === 0) {
            alert("Please select at least one AI model from the sidebar first.");
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text.trim(),
                    modelIds: selectedModels,
                    conversationHistory: messages.filter(m => m.isUser).slice(-5).map(m => ({
                        role: m.isUser ? "user" : "assistant",
                        content: m.text
                    }))
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "", // We'll use responses instead
                isUser: false,
                timestamp: new Date(),
                responses: data.responses
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `Error: ${error instanceof Error ? error.message : "Failed to get response. Please try again."}`,
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#1e1e1e] w-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-32">
                <div className="max-w-4xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center text-white">
                            <div className="max-w-md">
                                <h2 className="text-3xl font-bold mb-4">Welcome to Multibot</h2>
                                <p className="text-gray-300 text-lg mb-6">
                                    Select AI models from the sidebar and start a conversation. Get responses from multiple AI models at once!
                                </p>
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-200">🤖 Choose multiple AI models</p>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-200">💬 Compare responses</p>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <p className="text-gray-200">⚡ Get parallel insights</p>
                                    </div>
                                </div>
                                {selectedModels.length === 0 && (
                                    <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
                                        <p className="text-yellow-200 text-sm">
                                            👈 Please select at least one AI model from the sidebar to start chatting
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                                >
                                    {message.isUser ? (
                                        <div className="max-w-[70%] rounded-lg px-4 py-3 bg-blue-600 text-white">
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                            <p className="text-xs opacity-70 mt-1">
                                                {message.timestamp.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-[90%] w-full">
                                            {message.responses ? (
                                                <div className="space-y-4">
                                                    {message.responses.map((response, index) => (
                                                        <div key={index} className="bg-gray-700 text-gray-100 rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-medium text-blue-400">
                                                                        {response.modelName}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {response.provider}
                                                                    </span>
                                                                </div>
                                                                {response.error && (
                                                                    <span className="text-xs text-red-400">Error</span>
                                                                )}
                                                            </div>
                                                            <p className="whitespace-pre-wrap text-sm">
                                                                {response.response}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    <p className="text-xs opacity-70 text-gray-400 text-center">
                                                        {message.timestamp.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-3">
                                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                                    <p className="text-xs opacity-70 mt-1">
                                                        {message.timestamp.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-sm text-gray-400">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Chat Input */}
            <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
    );
};