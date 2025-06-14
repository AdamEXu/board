"use client";

import { useState, useEffect } from "react";
import { Tool, Point } from "@/types/whiteboard";
import { IconButton, ICONS } from "./Icon";

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    onZoomIn: (centerPoint?: Point, useButtons?: boolean) => void;
    onZoomOut: (centerPoint?: Point, useButtons?: boolean) => void;
    onChatOpen?: () => void;
    showOverflowMenu?: boolean;
    onOverflowMenuToggle?: (show: boolean) => void;
}

export const Toolbar = ({
    activeTool,
    onToolChange,
    onZoomIn,
    onZoomOut,
    onChatOpen,
    showOverflowMenu = false,
    onOverflowMenuToggle,
}: ToolbarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [collapsedPosition, setCollapsedPosition] = useState<
        | "bottom-center"
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right"
    >("bottom-left");
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);

    // Load collapsed position from localStorage on mount
    useEffect(() => {
        const loadCollapsedPosition = () => {
            try {
                const savedPosition = localStorage.getItem(
                    "toolbar-collapsed-position"
                );
                if (savedPosition) {
                    const position = savedPosition as typeof collapsedPosition;
                    // Validate the position is one of the allowed values
                    const validPositions = [
                        "bottom-center",
                        "bottom-left",
                        "bottom-right",
                        "top-left",
                        "top-right",
                    ];
                    if (validPositions.includes(position)) {
                        setCollapsedPosition(position);
                    }
                }
            } catch (error) {
                console.warn(
                    "Failed to load toolbar position from localStorage:",
                    error
                );
            }
        };

        loadCollapsedPosition();
    }, []);

    // Save collapsed position to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(
                "toolbar-collapsed-position",
                collapsedPosition
            );
        } catch (error) {
            console.warn(
                "Failed to save toolbar position to localStorage:",
                error
            );
        }
    }, [collapsedPosition]);

    // Listen for M key to toggle toolbar
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() === "m" &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
            ) {
                // Only toggle if not in a text input
                const activeElement = document.activeElement;
                if (
                    activeElement &&
                    (activeElement.tagName === "INPUT" ||
                        activeElement.tagName === "TEXTAREA")
                ) {
                    return;
                }
                event.preventDefault();
                setIsCollapsed(!isCollapsed);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCollapsed]);
    // Get position styles for collapsed toolbar
    const getCollapsedPositionStyles = () => {
        const baseStyles =
            "fixed z-50 animate-in slide-in-from-bottom-4 duration-500";
        switch (collapsedPosition) {
            case "top-left":
                return `${baseStyles} top-6 left-6`;
            case "top-right":
                return `${baseStyles} top-6 right-6`;
            case "bottom-left":
                return `${baseStyles} bottom-6 left-6`;
            case "bottom-right":
                return `${baseStyles} bottom-6 right-6`;
            case "bottom-center":
            default:
                return `${baseStyles} bottom-6 left-1/2 transform -translate-x-1/2`;
        }
    };

    // Handle drag start
    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setHasDragged(false);

        const startX = e.clientX;
        const startY = e.clientY;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            // Check if we've moved enough to consider it a drag
            const deltaX = Math.abs(moveEvent.clientX - startX);
            const deltaY = Math.abs(moveEvent.clientY - startY);
            if (deltaX > 10 || deltaY > 10) {
                setHasDragged(true);

                // Only update position if we're actually dragging
                // Calculate which corner to snap to based on mouse position
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const threshold = 150; // Distance from edge to snap

                let newPosition: typeof collapsedPosition = "bottom-center";

                if (
                    moveEvent.clientX < threshold &&
                    moveEvent.clientY < threshold
                ) {
                    newPosition = "top-left";
                } else if (
                    moveEvent.clientX > windowWidth - threshold &&
                    moveEvent.clientY < threshold
                ) {
                    newPosition = "top-right";
                } else if (
                    moveEvent.clientX < threshold &&
                    moveEvent.clientY > windowHeight - threshold
                ) {
                    newPosition = "bottom-left";
                } else if (
                    moveEvent.clientX > windowWidth - threshold &&
                    moveEvent.clientY > windowHeight - threshold
                ) {
                    newPosition = "bottom-right";
                } else {
                    newPosition = "bottom-center";
                }

                setCollapsedPosition(newPosition);
            }
        };

        const handleMouseUp = () => {
            const didDrag = hasDragged;
            setIsDragging(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // If we didn't drag, expand the toolbar
            if (!didDrag) {
                setIsCollapsed(false);
            }
            setHasDragged(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const tools = [
        {
            id: "select" as Tool,
            icon: ICONS.SELECT,
            label: "Select Tool",
            shortcut: ["V"],
        },
        {
            id: "text" as Tool,
            icon: ICONS.TEXT,
            label: "Text Tool",
            shortcut: ["T"],
        },
        {
            id: "arrow" as Tool,
            icon: ICONS.ARROW,
            label: "Arrow Tool",
            shortcut: ["F"],
        },
        {
            id: "line" as Tool,
            icon: ICONS.LINE,
            label: "Line Tool",
            shortcut: ["R"],
        },
    ];

    if (isCollapsed) {
        // Find the current tool's icon
        const currentToolIcon =
            tools.find((tool) => tool.id === activeTool)?.icon || ICONS.SELECT;

        return (
            <div className={getCollapsedPositionStyles()}>
                <div
                    onMouseDown={handleDragStart}
                    className={isDragging ? "cursor-grabbing" : "cursor-grab"}
                >
                    <IconButton
                        icon={currentToolIcon}
                        label="Expand Toolbar"
                        size={16}
                        className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/25"
                        active={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/25">
                <div className="flex items-center gap-3">
                    {/* Tools Section */}
                    <div className="flex items-center gap-2">
                        {tools.map((tool) => (
                            <IconButton
                                key={tool.id}
                                icon={tool.icon}
                                onClick={() => onToolChange(tool.id)}
                                active={activeTool === tool.id}
                                label={tool.label}
                                shortcut={tool.shortcut}
                                size={18}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/30 opacity-60" />

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={ICONS.ZOOM_OUT}
                            onClick={() => onZoomOut()}
                            label="Zoom Out (Cmd+-)"
                            size={16}
                        />
                        <IconButton
                            icon={ICONS.ZOOM_IN}
                            onClick={() => onZoomIn()}
                            label="Zoom In (Cmd++)"
                            size={16}
                        />
                    </div>

                    {/* Chat Button */}
                    {onChatOpen && (
                        <>
                            <div className="w-px h-6 bg-white/30 opacity-60" />
                            <div className="flex items-center gap-2">
                                <IconButton
                                    icon={ICONS.SPARKLES}
                                    onClick={onChatOpen}
                                    label="Open AI Chat"
                                    size={16}
                                />
                            </div>
                        </>
                    )}

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/30 opacity-60" />

                    {/* Overflow Menu */}
                    <div className="relative">
                        <IconButton
                            icon={ICONS.ELLIPSIS}
                            onClick={() =>
                                onOverflowMenuToggle?.(!showOverflowMenu)
                            }
                            label="More Options"
                            size={16}
                            active={showOverflowMenu}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
