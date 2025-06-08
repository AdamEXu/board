"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WhiteboardState } from "@/types/whiteboard";
import { prepareWhiteboardContext } from "@/utils/aiContext";

interface Message {
    id: string;
    content: string;
    sender: "user" | "ai";
    timestamp: Date;
    isLoading?: boolean;
    error?: boolean;
}

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    whiteboardState?: WhiteboardState;
    svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const ChatPopup = ({ isOpen, onClose, whiteboardState, svgRef }: ChatPopupProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSendMessage = async () => {
        if (inputValue.trim() === "" || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue("");
        setIsLoading(true);

        // Add user message
        const newUserMessage: Message = {
            id: Date.now().toString(),
            content: userMessage,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMessage]);

        // Add loading message
        const loadingMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Thinking...",
            sender: "ai",
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, loadingMessage]);

        try {
            // Prepare whiteboard context
            let context = null;
            if (whiteboardState && svgRef?.current) {
                context = await prepareWhiteboardContext(whiteboardState, svgRef.current);
            }

            // Send to AI API with streaming
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    whiteboardData: context?.whiteboardData,
                    imageBase64: context?.imageBase64,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            if (!reader) {
                throw new Error('No response body');
            }

            // Replace loading message with empty content to start streaming
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingMessage.id
                        ? {
                            ...msg,
                            content: '',
                            isLoading: false,
                        }
                        : msg
                )
            );

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedContent += parsed.content;

                                // Update the message with accumulated content
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === loadingMessage.id
                                            ? {
                                                ...msg,
                                                content: accumulatedContent,
                                            }
                                            : msg
                                    )
                                );
                            }
                        } catch {
                            // Ignore parsing errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Replace loading message with error message
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === loadingMessage.id
                        ? {
                            ...msg,
                            content: "Sorry, I encountered an error. Please try again.",
                            isLoading: false,
                            error: true,
                        }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
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
                        <div className="mb-4">
                            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xl">🤖</span>
                            </div>
                            <p className="font-medium mb-2">AI Whiteboard Assistant</p>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                I can analyze your whiteboard content and help with:
                                <br />• Organizing ideas and layouts
                                <br />• Summarizing your notes
                                <br />• Suggesting improvements
                                <br />• Answering questions about your content
                            </p>
                            {whiteboardState && whiteboardState.elements.length > 0 && (
                                <div className="mt-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block">
                                    ✓ Whiteboard context available
                                </div>
                            )}
                        </div>
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
                                        : message.error
                                        ? "bg-red-100/70 text-red-800 rounded-bl-none shadow-sm border border-red-200"
                                        : "bg-white/40 text-gray-800 rounded-bl-none shadow-sm"
                                }`}
                            >
                                {message.isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                        <span className="text-sm text-gray-600">Analyzing whiteboard...</span>
                                    </div>
                                ) : (
                                    message.sender === "ai" ? (
                                        <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-800 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-100 prose-pre:text-gray-800">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                    )
                                )}
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
                {whiteboardState && whiteboardState.elements.length > 0 && (
                    <div className="mb-2 text-xs text-gray-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Including whiteboard context ({whiteboardState.elements.length} elements)
                    </div>
                )}
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
                        disabled={inputValue.trim() === "" || isLoading}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/70 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600/70 hover:scale-105 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            "→"
                        )}
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
