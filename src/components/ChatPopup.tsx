"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
    id: string;
    content: string;
    sender: "user" | "ai";
    timestamp: Date;
}

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatPopup = ({ isOpen, onClose }: ChatPopupProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Drag and resize state
    const [position, setPosition] = useState({
        x: 0,
        y: 24,
    });
    const [size, setSize] = useState({ width: 320, height: 384 });

    // Initialize position after component mounts
    useEffect(() => {
        if (typeof window !== "undefined") {
            setPosition({
                x: window.innerWidth - 320 - 24,
                y: 24,
            });
        }
    }, []);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const chatRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Drag functionality
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (
                e.target === e.currentTarget ||
                (e.target as HTMLElement).classList.contains("drag-handle")
            ) {
                setIsDragging(true);
                setDragStart({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                });
            }
        },
        [position]
    );

    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeStart({
                x: e.clientX,
                y: e.clientY,
                width: size.width,
                height: size.height,
            });
        },
        [size]
    );

    // Global mouse move and up handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && typeof window !== "undefined") {
                setPosition({
                    x: Math.max(
                        0,
                        Math.min(
                            window.innerWidth - size.width,
                            e.clientX - dragStart.x
                        )
                    ),
                    y: Math.max(
                        0,
                        Math.min(
                            window.innerHeight - size.height,
                            e.clientY - dragStart.y
                        )
                    ),
                });
            } else if (isResizing && typeof window !== "undefined") {
                const newWidth = Math.max(
                    280,
                    resizeStart.width + (e.clientX - resizeStart.x)
                );
                const newHeight = Math.max(
                    200,
                    resizeStart.height + (e.clientY - resizeStart.y)
                );
                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, resizeStart, size]);

    const handleSendMessage = () => {
        if (inputValue.trim() === "") return;

        // Add user message
        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputValue("");

        // For now, just echo back the message as if from AI
        // This will be replaced with actual AI integration later
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: `You said: ${inputValue}`,
                sender: "ai",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={chatRef}
            className="fixed z-50 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg shadow-lg hover:shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in select-none"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                cursor: isDragging ? "grabbing" : "default",
            }}
        >
            {/* Header */}
            <div
                className="p-3 border-b border-white/30 flex justify-between items-center bg-white/10 backdrop-blur-sm drag-handle cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <h3 className="text-gray-800 font-medium pointer-events-none">
                    AI Assistant
                </h3>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white/20 hover:scale-110 active:scale-95 pointer-events-auto"
                >
                    ×
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-600 mt-10 animate-in fade-in duration-500">
                        <p>Ask me anything about your whiteboard!</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message.id}
                            className={`mb-3 max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                                message.sender === "user"
                                    ? "ml-auto"
                                    : "mr-auto"
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div
                                className={`p-2 rounded-lg hover:scale-[1.02] ${
                                    message.sender === "user"
                                        ? "bg-blue-500/70 text-white rounded-br-none shadow-sm"
                                        : "bg-white/40 text-gray-800 rounded-bl-none shadow-sm"
                                }`}
                            >
                                {message.content}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/30 bg-white/10 backdrop-blur-sm">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-full bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 placeholder-gray-500 focus:bg-white/40"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={inputValue.trim() === ""}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/70 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/70 hover:scale-105 active:scale-95"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Resize handle */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/40"
                onMouseDown={handleResizeMouseDown}
                style={{
                    clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
                }}
            />
        </div>
    );
};
