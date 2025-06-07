"use client";

import { useState } from "react";
import { Tool, Point } from "@/types/whiteboard";
import { IconButton, ICONS } from "./Icon";

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    onZoomIn: (centerPoint?: Point, useButtons?: boolean) => void;
    onZoomOut: (centerPoint?: Point, useButtons?: boolean) => void;
    onResetView: () => void;
    onClearCanvas: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoom: number;
    onChatOpen?: () => void;
}

export const Toolbar = ({
    activeTool,
    onToolChange,
    onZoomIn,
    onZoomOut,
    onResetView,
    onClearCanvas,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    zoom,
    onChatOpen,
}: ToolbarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [collapsedPosition, setCollapsedPosition] = useState<
        | "bottom-center"
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right"
    >("bottom-center");
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);

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

    const handleClearCanvas = () => {
        if (
            window.confirm(
                "Are you sure you want to clear the entire canvas? This action cannot be undone."
            )
        ) {
            onClearCanvas();
        }
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
                    {/* Collapse Button */}
                    <div className="flex items-center">
                        <IconButton
                            icon={ICONS.MINIMIZE}
                            onClick={() => setIsCollapsed(true)}
                            label="Minimize Toolbar"
                            size={14}
                        />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/30 opacity-60" />

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

                    {/* Undo/Redo Controls */}
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={ICONS.UNDO}
                            onClick={onUndo}
                            disabled={!canUndo}
                            label="Undo"
                            shortcut={["⌘", "Z"]}
                            size={16}
                        />
                        <IconButton
                            icon={ICONS.REDO}
                            onClick={onRedo}
                            disabled={!canRedo}
                            label="Redo"
                            shortcut={["⌘", "⇧", "Z"]}
                            size={16}
                        />
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
                        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                            <span className="text-sm text-gray-700 font-medium min-w-[3rem] text-center block">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>
                        <IconButton
                            icon={ICONS.ZOOM_IN}
                            onClick={() => onZoomIn()}
                            label="Zoom In (Cmd++)"
                            size={16}
                        />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/30 opacity-60" />

                    {/* View Controls */}
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={ICONS.RESET_VIEW}
                            onClick={onResetView}
                            label="Reset View (Cmd+0)"
                            size={16}
                        />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-white/30 opacity-60" />

                    {/* Canvas Controls */}
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={ICONS.CLEAR}
                            onClick={handleClearCanvas}
                            label="Clear Canvas"
                            size={16}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50/50"
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
                </div>
            </div>
        </div>
    );
};
