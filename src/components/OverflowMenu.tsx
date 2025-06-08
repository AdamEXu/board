"use client";

import { useRef, useEffect } from "react";
import { Icon, ICONS } from "./Icon";

interface OverflowMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onResetView: () => void;
    onClearCanvas: () => void;
    onMinimize: () => void;
    onSettings: () => void;
    onExportPNG?: () => void;
    onExportJSON?: () => void;
    onImportJSON?: () => void;
    position: { x: number; y: number };
}

export const OverflowMenu = ({
    isOpen,
    onClose,
    onResetView,
    onClearCanvas,
    onMinimize,
    onSettings,
    onExportPNG,
    onExportJSON,
    onImportJSON,
    position,
}: OverflowMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleClearCanvas = () => {
        if (
            window.confirm(
                "Are you sure you want to clear the entire canvas? This action cannot be undone."
            )
        ) {
            onClearCanvas();
        }
        onClose();
    };

    const handleExportPNG = () => {
        if (onExportPNG) {
            onExportPNG();
        }
        onClose();
    };

    const handleResetView = () => {
        onResetView();
        onClose();
    };

    const handleMinimize = () => {
        onMinimize();
        onClose();
    };

    const handleSettings = () => {
        onSettings();
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className="fixed bg-white/30 backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl py-3 min-w-52 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            {/* Settings */}
            <button
                onClick={handleSettings}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    <Icon
                        name={ICONS.SETTINGS}
                        size={16}
                        className="group-hover:scale-110 transition-transform duration-150"
                    />
                </div>
                <span className="font-medium text-gray-800">Settings</span>
            </button>

            {/* Divider */}
            <div className="mx-3 my-2 h-px bg-white/30"></div>

            {/* View Controls */}
            <button
                onClick={handleResetView}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    <Icon
                        name={ICONS.RESET_VIEW}
                        size={16}
                        className="group-hover:scale-110 transition-transform duration-150"
                    />
                </div>
                <span className="font-medium text-gray-800">Reset View</span>
            </button>
            <button
                onClick={handleMinimize}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    <Icon
                        name={ICONS.MINIMIZE}
                        size={16}
                        className="group-hover:scale-110 transition-transform duration-150"
                    />
                </div>
                <span className="font-medium text-gray-800">
                    Minimize Toolbar
                </span>
            </button>

            {/* Divider */}
            <div className="mx-3 my-2 h-px bg-white/30"></div>

            {/* Export/Import */}
            {(onExportPNG || onExportJSON || onImportJSON) && (
                <>
                    {onExportPNG && (
                        <button
                            onClick={handleExportPNG}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Icon
                                    name={ICONS.EXPORT_PNG}
                                    size={16}
                                    className="group-hover:scale-110 transition-transform duration-150"
                                />
                            </div>
                            <span className="font-medium text-gray-800">
                                Export as PNG
                            </span>
                        </button>
                    )}
                    {onExportJSON && (
                        <button
                            onClick={() => {
                                onExportJSON();
                                onClose();
                            }}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Icon
                                    name={ICONS.EXPORT}
                                    size={16}
                                    className="group-hover:scale-110 transition-transform duration-150"
                                />
                            </div>
                            <span className="font-medium text-gray-800">
                                Export as JSON
                            </span>
                        </button>
                    )}
                    {onImportJSON && (
                        <button
                            onClick={() => {
                                onImportJSON();
                                onClose();
                            }}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/20 active:bg-white/30 flex items-center gap-3 transition-all duration-150 group"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <Icon
                                    name={ICONS.IMPORT}
                                    size={16}
                                    className="group-hover:scale-110 transition-transform duration-150"
                                />
                            </div>
                            <span className="font-medium text-gray-800">
                                Import JSON
                            </span>
                        </button>
                    )}

                    {/* Divider before destructive actions */}
                    <div className="mx-3 my-2 h-px bg-white/30"></div>
                </>
            )}

            {/* Destructive Actions */}
            <button
                onClick={handleClearCanvas}
                className="w-full px-4 py-3 text-left text-sm hover:bg-red-50/50 active:bg-red-100/50 flex items-center gap-3 transition-all duration-150 group"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    <Icon
                        name={ICONS.CLEAR}
                        size={16}
                        className="group-hover:scale-110 transition-transform duration-150 text-red-600"
                    />
                </div>
                <span className="font-medium text-red-600">Clear Canvas</span>
            </button>
        </div>
    );
};
