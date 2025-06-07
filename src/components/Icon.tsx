"use client";

import { useState, useEffect } from "react";

interface IconProps {
    name: string;
    size?: number;
    className?: string;
    color?: string;
    hoverColor?: string;
    disabled?: boolean;
    loading?: boolean;
}

export const Icon = ({
    name,
    size = 20,
    className = "",
    color = "currentColor",
    hoverColor,
    disabled = false,
    loading = false,
}: IconProps) => {
    const [svgContent, setSvgContent] = useState<string>("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadSvg = async () => {
            try {
                setError(false);
                const response = await fetch(`/${name}`);
                if (!response.ok) {
                    throw new Error(`Failed to load icon: ${name}`);
                }
                const content = await response.text();
                setSvgContent(content);
                setIsLoaded(true);
            } catch (err) {
                console.error(`Error loading icon ${name}:`, err);
                setError(true);
                setIsLoaded(true);
            }
        };

        loadSvg();
    }, [name]);

    if (loading) {
        return (
            <div
                className={`inline-flex items-center justify-center animate-pulse ${className}`}
                style={{ width: size, height: size }}
            >
                <div
                    className="bg-current opacity-20 rounded"
                    style={{ width: size * 0.8, height: size * 0.8 }}
                />
            </div>
        );
    }

    if (error || !isLoaded) {
        return (
            <div
                className={`inline-flex items-center justify-center ${className}`}
                style={{ width: size, height: size }}
            >
                <div
                    className="bg-current opacity-30 rounded"
                    style={{ width: size * 0.6, height: size * 0.6 }}
                />
            </div>
        );
    }

    // Process SVG content to apply props
    const processedSvg = svgContent
        .replace(/width="[^"]*"/g, `width="${size}"`)
        .replace(/height="[^"]*"/g, `height="${size}"`)
        .replace(/fill="[^"]*"/g, `fill="${color}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${color}"`);

    const baseClasses = `
        inline-flex items-center justify-center
        transition-all duration-200 ease-out
        transform-gpu
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${hoverColor ? "group" : ""}
        ${className}
    `;

    const hoverStyles = hoverColor
        ? {
              "--hover-color": hoverColor,
          }
        : {};

    return (
        <div
            className={baseClasses}
            style={{
                width: size,
                height: size,
                ...hoverStyles,
            }}
            dangerouslySetInnerHTML={{ __html: processedSvg }}
        />
    );
};

// Keyboard shortcut component
const KeyboardShortcut = ({ keys }: { keys: string[] }) => {
    return (
        <div className="flex items-center gap-1">
            {keys.map((key, index) => (
                <span
                    key={index}
                    className="inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-800 text-white rounded border border-gray-600 shadow-sm min-w-[20px] text-center"
                >
                    {key}
                </span>
            ))}
        </div>
    );
};

// Tooltip component
const Tooltip = ({
    children,
    label,
    shortcut,
}: {
    children: React.ReactNode;
    label: string;
    shortcut?: string[];
}) => {
    return (
        <div className="group relative">
            {children}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {shortcut && <KeyboardShortcut keys={shortcut} />}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
        </div>
    );
};

// Predefined icon mappings for common use cases
export const IconButton = ({
    icon,
    onClick,
    onMouseDown,
    disabled = false,
    loading = false,
    active = false,
    size = 20,
    className = "",
    label,
    shortcut,
    ...iconProps
}: {
    icon: string;
    onClick?: () => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    loading?: boolean;
    active?: boolean;
    size?: number;
    className?: string;
    label?: string;
    shortcut?: string[];
} & Omit<IconProps, "name" | "size" | "disabled" | "loading">) => {
    const buttonContent = (
        <button
            onClick={onClick}
            onMouseDown={onMouseDown}
            disabled={disabled || loading}
            className={`
                group relative
                w-10 h-10 rounded-full
                flex items-center justify-center
                transition-all duration-200 ease-out
                transform-gpu
                hover:scale-105 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                ${
                    active
                        ? "bg-white/30 text-gray-900 shadow-sm"
                        : "text-gray-700 hover:text-gray-900"
                }
                ${
                    disabled || loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-white/20 active:bg-white/30"
                }
                ${className}
            `}
        >
            <Icon
                name={icon}
                size={size}
                disabled={disabled}
                loading={loading}
                {...iconProps}
            />

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </button>
    );

    if (label) {
        return (
            <Tooltip label={label} shortcut={shortcut}>
                {buttonContent}
            </Tooltip>
        );
    }

    return buttonContent;
};

// Common icon names for type safety
export const ICONS = {
    SELECT: "hand.point.up.left.svg",
    TEXT: "character.textbox.svg",
    ARROW: "line.diagonal.arrow.svg",
    LINE: "line.diagonal.svg",
    UNDO: "arrow.uturn.backward.svg",
    REDO: "arrow.uturn.forward.svg",
    ZOOM_IN: "plus.magnifyingglass.svg",
    ZOOM_OUT: "minus.magnifyingglass.svg",
    RESET_VIEW: "square.arrowtriangle.4.outward.svg",
    CLEAR: "trash.svg",
    SETTINGS: "gearshape.svg",
    SPARKLES: "sparkles.rectangle.stack.svg",
    CHAT: "message.circle.svg",
    BOLD: "bold.svg",
    ITALIC: "italic.svg",
    UNDERLINE: "underline.svg",
    MINIMIZE: "arrow.down.right.and.arrow.up.left.svg",
    MAXIMIZE: "arrow.up.left.and.arrow.down.right.svg",
} as const;
