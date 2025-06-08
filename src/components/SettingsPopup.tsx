"use client";

import { useRef, useEffect } from "react";
import { Icon, ICONS } from "./Icon";

interface SettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    showGrid: boolean;
    onToggleGrid: (show: boolean) => void;
    gridSnapping: boolean;
    onToggleGridSnapping: (snap: boolean) => void;
}

export const SettingsPopup = ({
    isOpen,
    onClose,
    showGrid,
    onToggleGrid,
    gridSnapping,
    onToggleGridSnapping,
}: SettingsPopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
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

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
            
            {/* Settings Popup */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    ref={popupRef}
                    className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 fade-in duration-200"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                            <Icon name={ICONS.SETTINGS} size={20} />
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 active:bg-white/30 transition-all duration-150 group"
                        >
                            <Icon 
                                name={ICONS.CLOSE} 
                                size={16} 
                                className="group-hover:scale-110 transition-transform duration-150"
                            />
                        </button>
                    </div>

                    {/* Grid Settings Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700 mb-3">Grid & Snapping</h3>
                        
                        {/* Show Grid Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-150">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20">
                                    <Icon name={ICONS.GRID} size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800">Show Grid</div>
                                    <div className="text-sm text-gray-600">Display grid lines on the canvas</div>
                                </div>
                            </div>
                            <button
                                onClick={() => onToggleGrid(!showGrid)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                                    showGrid 
                                        ? 'bg-blue-500 shadow-lg' 
                                        : 'bg-gray-300'
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                                        showGrid ? 'left-6' : 'left-0.5'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Grid Snapping Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-150">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20">
                                    <Icon name={ICONS.MAGNET} size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800">Grid Snapping</div>
                                    <div className="text-sm text-gray-600">Snap elements to grid intersections</div>
                                </div>
                            </div>
                            <button
                                onClick={() => onToggleGridSnapping(!gridSnapping)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                                    gridSnapping 
                                        ? 'bg-blue-500 shadow-lg' 
                                        : 'bg-gray-300'
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                                        gridSnapping ? 'left-6' : 'left-0.5'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-lg transition-all duration-150 shadow-lg hover:shadow-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
