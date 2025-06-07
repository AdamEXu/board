"use client";

import {
    Tool,
    TextElement,
    LineElement,
    ArrowElement,
} from "@/types/whiteboard";
import { IconButton, ICONS } from "./Icon";

interface ContextToolbarProps {
    activeTool: Tool;
    selectedElementId: string | null;
    selectedElementType?: string;
    selectedElement?: TextElement | LineElement | ArrowElement | null;
    onUpdateElement: (id: string, updates: Record<string, unknown>) => void;
    currentStyles?: {
        fontSize: number;
        fontFamily: string;
        color: string;
        bold: boolean;
        italic: boolean;
        underline: boolean;
        strokeWidth: number;
        lineColor: string;
    };
    onUpdateCurrentStyles?: (styleUpdates: Record<string, unknown>) => void;
}

export const ContextToolbar = ({
    activeTool,
    selectedElementId,
    selectedElementType,
    selectedElement,
    onUpdateElement,
    currentStyles,
    onUpdateCurrentStyles,
}: ContextToolbarProps) => {
    // Show toolbar when a tool is selected (not select tool) or when an object is selected
    const shouldShow = activeTool !== "select" || selectedElementId !== null;

    if (!shouldShow) {
        return null;
    }

    const renderTextControls = () => {
        if (activeTool !== "text" && selectedElementType !== "text") {
            return null;
        }

        const textElement = selectedElement as TextElement | null;
        const currentFontSize =
            textElement?.fontSize ?? currentStyles?.fontSize ?? 16;
        const currentColor =
            textElement?.color ?? currentStyles?.color ?? "#000000";
        const isBold = textElement?.bold ?? currentStyles?.bold ?? false;
        const isItalic = textElement?.italic ?? currentStyles?.italic ?? false;
        const isUnderline =
            textElement?.underline ?? currentStyles?.underline ?? false;

        return (
            <>
                {/* Font Size */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                        Size:
                    </span>
                    <select
                        className="px-2 py-1 rounded bg-white/20 backdrop-blur-sm border border-white/20 text-sm"
                        value={currentFontSize}
                        onChange={(e) => {
                            const newFontSize = parseInt(e.target.value);
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    fontSize: newFontSize,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({
                                    fontSize: newFontSize,
                                });
                            }
                        }}
                    >
                        <option value="12">12</option>
                        <option value="14">14</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                        <option value="20">20</option>
                        <option value="24">24</option>
                        <option value="28">28</option>
                        <option value="32">32</option>
                    </select>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/30 opacity-60" />

                {/* Text Formatting */}
                <div className="flex items-center gap-1">
                    <IconButton
                        icon={ICONS.BOLD}
                        onClick={() => {
                            const newBold = !isBold;
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    bold: newBold,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({ bold: newBold });
                            }
                        }}
                        active={isBold}
                        label="Bold"
                        size={16}
                    />
                    <IconButton
                        icon={ICONS.ITALIC}
                        onClick={() => {
                            const newItalic = !isItalic;
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    italic: newItalic,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({ italic: newItalic });
                            }
                        }}
                        active={isItalic}
                        label="Italic"
                        size={16}
                    />
                    <IconButton
                        icon={ICONS.UNDERLINE}
                        onClick={() => {
                            const newUnderline = !isUnderline;
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    underline: newUnderline,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({
                                    underline: newUnderline,
                                });
                            }
                        }}
                        active={isUnderline}
                        label="Underline"
                        size={16}
                    />
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/30 opacity-60" />

                {/* Font Color */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                        Color:
                    </span>
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                            const newColor = e.target.value;
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    color: newColor,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({ color: newColor });
                            }
                        }}
                        className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                        title="Font Color"
                    />
                </div>
            </>
        );
    };

    const renderLineControls = () => {
        if (
            activeTool !== "line" &&
            activeTool !== "arrow" &&
            selectedElementType !== "line" &&
            selectedElementType !== "arrow"
        ) {
            return null;
        }

        const lineElement = selectedElement as
            | LineElement
            | ArrowElement
            | null;
        const currentStrokeWidth =
            lineElement?.strokeWidth ?? currentStyles?.strokeWidth ?? 2;
        const currentColor =
            lineElement?.color ?? currentStyles?.lineColor ?? "#000000";

        return (
            <>
                {/* Line Weight */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                        Weight:
                    </span>
                    <select
                        className="px-2 py-1 rounded bg-white/20 backdrop-blur-sm border border-white/20 text-sm"
                        value={currentStrokeWidth}
                        onChange={(e) => {
                            const newStrokeWidth = parseInt(e.target.value);
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    strokeWidth: newStrokeWidth,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({
                                    strokeWidth: newStrokeWidth,
                                });
                            }
                        }}
                    >
                        <option value="1">1px</option>
                        <option value="2">2px</option>
                        <option value="3">3px</option>
                        <option value="4">4px</option>
                        <option value="5">5px</option>
                        <option value="6">6px</option>
                        <option value="8">8px</option>
                        <option value="10">10px</option>
                    </select>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/30 opacity-60" />

                {/* Line Color */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">
                        Color:
                    </span>
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                            const newColor = e.target.value;
                            if (selectedElementId) {
                                onUpdateElement(selectedElementId, {
                                    color: newColor,
                                });
                            }
                            // Update current styles for future elements
                            if (onUpdateCurrentStyles) {
                                onUpdateCurrentStyles({ lineColor: newColor });
                            }
                        }}
                        className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                        title="Line Color"
                    />
                </div>
            </>
        );
    };

    return (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/25">
                <div className="flex items-center gap-4">
                    {renderTextControls()}
                    {renderLineControls()}
                </div>
            </div>
        </div>
    );
};
