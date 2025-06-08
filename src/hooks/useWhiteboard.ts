"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    WhiteboardState,
    WhiteboardElement,
    TextElement,
    LineElement,
    ArrowElement,
    Tool,
    Point,
} from "@/types/whiteboard";
import {
    saveWhiteboardState,
    loadWhiteboardState,
    getDefaultWhiteboardState,
} from "@/utils/storage";

export const useWhiteboard = () => {
    const [state, setState] = useState<WhiteboardState>(
        getDefaultWhiteboardState()
    );
    const [activeTool, setActiveTool] = useState<Tool>("select");
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentElement, setCurrentElement] =
        useState<WhiteboardElement | null>(null);

    // Style state for auto-applying styles to new elements
    const [currentStyles, setCurrentStyles] = useState({
        // Text styles
        fontSize: 16,
        fontFamily: "Arial",
        color: "#000000",
        bold: false,
        italic: false,
        underline: false,
        // Line/Arrow styles
        strokeWidth: 2,
        lineColor: "#000000",
    });

    // Undo/Redo state
    const [history, setHistory] = useState<WhiteboardElement[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = loadWhiteboardState();
        if (savedState) {
            setState(savedState);
            // Initialize history with loaded state
            setHistory([savedState.elements]);
            setHistoryIndex(0);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        saveWhiteboardState(state);
    }, [state]);

    const addElement = useCallback(
        (element: WhiteboardElement, saveHistory = true) => {
            if (saveHistory) {
                // Save current state before adding
                setHistory((prev) => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push([...state.elements]);
                    return newHistory.slice(-50); // Keep last 50 states
                });
                setHistoryIndex((prev) => Math.min(prev + 1, 49));
            }

            setState((prev) => ({
                ...prev,
                elements: [...prev.elements, element],
            }));
        },
        [historyIndex, state.elements]
    );

    const updateElement = useCallback(
        (id: string, updates: Record<string, unknown>, saveHistory = true) => {
            if (saveHistory) {
                // Save current state before updating
                setHistory((prev) => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push([...state.elements]);
                    return newHistory.slice(-50); // Keep last 50 states
                });
                setHistoryIndex((prev) => Math.min(prev + 1, 49));
            }

            setState((prev) => ({
                ...prev,
                elements: prev.elements.map((el) =>
                    el.id === id
                        ? ({ ...el, ...updates } as WhiteboardElement)
                        : el
                ),
            }));
        },
        [historyIndex, state.elements]
    );

    const updateCurrentStyles = useCallback(
        (styleUpdates: Partial<typeof currentStyles>) => {
            setCurrentStyles((prev) => ({
                ...prev,
                ...styleUpdates,
            }));
        },
        []
    );

    const removeElement = useCallback(
        (id: string, saveHistory = true) => {
            if (saveHistory) {
                // Save current state before removing
                setHistory((prev) => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push([...state.elements]);
                    return newHistory.slice(-50); // Keep last 50 states
                });
                setHistoryIndex((prev) => Math.min(prev + 1, 49));
            }

            setState((prev) => ({
                ...prev,
                elements: prev.elements.filter((el) => el.id !== id),
            }));
        },
        [historyIndex, state.elements]
    );

    const clearCanvas = useCallback(
        (saveHistory = true) => {
            if (saveHistory) {
                // Save current state before clearing
                setHistory((prev) => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push([...state.elements]);
                    return newHistory.slice(-50); // Keep last 50 states
                });
                setHistoryIndex((prev) => Math.min(prev + 1, 49));
            }

            setState((prev) => ({
                ...prev,
                elements: [],
            }));
        },
        [historyIndex, state.elements]
    );

    const updateViewBox = useCallback(
        (updates: Partial<WhiteboardState["viewBox"]>) => {
            setState((prev) => ({
                ...prev,
                viewBox: { ...prev.viewBox, ...updates },
            }));
        },
        []
    );

    // Predefined zoom levels for button-based zooming
    const zoomLevels = useMemo(
        () => [
            0.1, 0.25, 0.5, 0.75, 0.9, 1.0, 1.1, 1.25, 1.4, 1.5, 1.8, 2.0, 2.5,
            3.0, 3.5, 4.0, 5.0,
        ],
        []
    );

    const zoomIn = useCallback(
        (centerPoint?: Point, useButtons = false) => {
            let newZoom;
            if (useButtons) {
                // Find next zoom level for button-based zooming
                const currentIndex = zoomLevels.findIndex(
                    (level) => level >= state.viewBox.zoom
                );
                const nextIndex = Math.min(
                    currentIndex + 1,
                    zoomLevels.length - 1
                );
                newZoom = zoomLevels[nextIndex];
            } else {
                // Smooth zooming for scroll wheel
                newZoom = Math.min(state.viewBox.zoom * 1.04, 5);
            }

            if (centerPoint && !isNaN(centerPoint.x) && !isNaN(centerPoint.y)) {
                const zoomRatio = newZoom / state.viewBox.zoom;
                const newX =
                    centerPoint.x -
                    (centerPoint.x - (state.viewBox.x || 0)) / zoomRatio;
                const newY =
                    centerPoint.y -
                    (centerPoint.y - (state.viewBox.y || 0)) / zoomRatio;
                updateViewBox({ zoom: newZoom, x: newX, y: newY });
            } else {
                // For button/keyboard zoom without center point, zoom to center of viewport
                updateViewBox({ zoom: newZoom });
            }
        },
        [state.viewBox, updateViewBox, zoomLevels]
    );

    const zoomOut = useCallback(
        (centerPoint?: Point, useButtons = false) => {
            let newZoom;
            if (useButtons) {
                // Find previous zoom level for button-based zooming
                const currentIndex =
                    zoomLevels.findIndex(
                        (level) => level > state.viewBox.zoom
                    ) - 1;
                const prevIndex = Math.max(currentIndex - 1, 0);
                newZoom = zoomLevels[prevIndex];
            } else {
                // Smooth zooming for scroll wheel
                newZoom = Math.max(state.viewBox.zoom / 1.04, 0.1);
            }

            if (centerPoint && !isNaN(centerPoint.x) && !isNaN(centerPoint.y)) {
                const zoomRatio = newZoom / state.viewBox.zoom;
                const newX =
                    centerPoint.x -
                    (centerPoint.x - (state.viewBox.x || 0)) / zoomRatio;
                const newY =
                    centerPoint.y -
                    (centerPoint.y - (state.viewBox.y || 0)) / zoomRatio;
                updateViewBox({ zoom: newZoom, x: newX, y: newY });
            } else {
                // For button/keyboard zoom without center point, zoom to center of viewport
                updateViewBox({ zoom: newZoom });
            }
        },
        [state.viewBox, updateViewBox, zoomLevels]
    );

    const resetView = useCallback(() => {
        updateViewBox({ x: 0, y: 0, zoom: 1 });
    }, [updateViewBox]);

    const pan = useCallback(
        (deltaX: number, deltaY: number) => {
            updateViewBox({
                x: state.viewBox.x - deltaX / state.viewBox.zoom,
                y: state.viewBox.y - deltaY / state.viewBox.zoom,
            });
        },
        [state.viewBox, updateViewBox]
    );

    const screenToCanvas = useCallback(
        (screenPoint: Point): Point => {
            return {
                x: screenPoint.x / state.viewBox.zoom + state.viewBox.x,
                y: screenPoint.y / state.viewBox.zoom + state.viewBox.y,
            };
        },
        [state.viewBox]
    );

    const canvasToScreen = useCallback(
        (canvasPoint: Point): Point => {
            return {
                x: (canvasPoint.x - state.viewBox.x) * state.viewBox.zoom,
                y: (canvasPoint.y - state.viewBox.y) * state.viewBox.zoom,
            };
        },
        [state.viewBox]
    );

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setState((prev) => ({
                ...prev,
                elements: [...history[newIndex]],
            }));
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setState((prev) => ({
                ...prev,
                elements: [...history[newIndex]],
            }));
        }
    }, [historyIndex, history]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Export whiteboard state to JSON
    const exportToJSON = useCallback(() => {
        const exportData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            whiteboard: {
                elements: state.elements,
                viewBox: state.viewBox,
            },
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `whiteboard-${
            new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [state.elements, state.viewBox]);

    // Import whiteboard state from JSON
    const importFromJSON = useCallback(
        (file: File) => {
            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result as string;
                        const importData = JSON.parse(content);

                        // Validate the imported data structure
                        if (
                            !importData.whiteboard ||
                            !Array.isArray(importData.whiteboard.elements)
                        ) {
                            throw new Error("Invalid whiteboard file format");
                        }

                        // Validate each element has required properties
                        const elements = importData.whiteboard.elements;
                        for (const element of elements) {
                            if (!element.id || !element.type) {
                                throw new Error(
                                    "Invalid element format in whiteboard file"
                                );
                            }

                            // Validate element type-specific properties
                            if (element.type === "text") {
                                if (
                                    !element.position ||
                                    typeof element.content !== "string"
                                ) {
                                    throw new Error(
                                        "Invalid text element format"
                                    );
                                }
                            } else if (
                                element.type === "line" ||
                                element.type === "arrow"
                            ) {
                                if (!element.start || !element.end) {
                                    throw new Error(
                                        "Invalid line/arrow element format"
                                    );
                                }
                            }
                        }

                        // Save current state to history before importing
                        setHistory((prev) => {
                            const newHistory = prev.slice(0, historyIndex + 1);
                            newHistory.push([...state.elements]);
                            return newHistory.slice(-50);
                        });
                        setHistoryIndex((prev) => Math.min(prev + 1, 49));

                        // Import the data
                        setState({
                            elements: importData.whiteboard.elements,
                            viewBox: importData.whiteboard.viewBox || {
                                x: 0,
                                y: 0,
                                zoom: 1,
                            },
                        });

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.readAsText(file);
            });
        },
        [historyIndex, state.elements]
    );

    // Export whiteboard as PNG
    const exportToPNG = useCallback(
        (
            options: {
                includeGrid?: boolean;
                quality?: "low" | "medium" | "high";
            } = {}
        ) => {
            const { includeGrid = false, quality = "high" } = options;
            // Create a temporary canvas to render the SVG
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Set canvas size based on quality
            const qualitySettings = {
                low: { scale: 1, width: 1280, height: 720 },
                medium: { scale: 1.5, width: 1920, height: 1080 },
                high: { scale: 2, width: 2560, height: 1440 },
            };
            const { scale, width, height } = qualitySettings[quality];
            canvas.width = width * scale;
            canvas.height = height * scale;

            // Scale the context for high DPI
            ctx.scale(scale, scale);

            // Set white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

            // Calculate bounds of all elements to center the export
            if (state.elements.length === 0) {
                // If no elements, just export empty canvas
                downloadCanvas(canvas);
                return;
            }

            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            state.elements.forEach((element) => {
                if (element.type === "text") {
                    const textEl = element as TextElement;
                    minX = Math.min(minX, textEl.position.x);
                    minY = Math.min(minY, textEl.position.y - textEl.fontSize);
                    maxX = Math.max(
                        maxX,
                        textEl.position.x + (textEl.width || 100)
                    );
                    maxY = Math.max(
                        maxY,
                        textEl.position.y + (textEl.height || textEl.fontSize)
                    );
                } else if (
                    element.type === "line" ||
                    element.type === "arrow"
                ) {
                    const lineEl = element as LineElement | ArrowElement;
                    minX = Math.min(minX, lineEl.start.x, lineEl.end.x);
                    minY = Math.min(minY, lineEl.start.y, lineEl.end.y);
                    maxX = Math.max(maxX, lineEl.start.x, lineEl.end.x);
                    maxY = Math.max(maxY, lineEl.start.y, lineEl.end.y);
                }
            });

            // Add padding
            const padding = 50;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            // Calculate scale to fit content
            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;
            const scaleX = canvas.width / scale / contentWidth;
            const scaleY = canvas.height / scale / contentHeight;
            const exportScale = Math.min(scaleX, scaleY, 1); // Don't scale up

            // Center the content
            const offsetX =
                (canvas.width / scale - contentWidth * exportScale) / 2 -
                minX * exportScale;
            const offsetY =
                (canvas.height / scale - contentHeight * exportScale) / 2 -
                minY * exportScale;

            // Draw grid if requested (before elements)
            if (includeGrid) {
                ctx.save();
                ctx.translate(offsetX, offsetY);
                ctx.scale(exportScale, exportScale);

                const gridSize = 20;
                ctx.strokeStyle = "#99a8ad";
                ctx.lineWidth = 1 / exportScale; // Adjust line width for scale
                ctx.globalAlpha = 0.5;

                // Calculate grid bounds
                const gridMinX = Math.floor((minX - 100) / gridSize) * gridSize;
                const gridMaxX = Math.ceil((maxX + 100) / gridSize) * gridSize;
                const gridMinY = Math.floor((minY - 100) / gridSize) * gridSize;
                const gridMaxY = Math.ceil((maxY + 100) / gridSize) * gridSize;

                // Draw vertical lines
                for (let x = gridMinX; x <= gridMaxX; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, gridMinY);
                    ctx.lineTo(x, gridMaxY);
                    ctx.stroke();
                }

                // Draw horizontal lines
                for (let y = gridMinY; y <= gridMaxY; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(gridMinX, y);
                    ctx.lineTo(gridMaxX, y);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Render elements
            state.elements.forEach((element) => {
                ctx.save();
                ctx.translate(offsetX, offsetY);
                ctx.scale(exportScale, exportScale);

                if (element.type === "text") {
                    const textEl = element as TextElement;
                    ctx.font = `${textEl.bold ? "bold " : ""}${
                        textEl.italic ? "italic " : ""
                    }${textEl.fontSize}px ${textEl.fontFamily}`;
                    ctx.fillStyle = textEl.color;
                    ctx.textBaseline = "top";

                    const lines = textEl.content.split("\n");
                    lines.forEach((line: string, index: number) => {
                        const lineY =
                            textEl.position.y -
                            textEl.fontSize +
                            index * textEl.fontSize * 1.2;

                        // Draw text
                        ctx.fillText(line, textEl.position.x, lineY);

                        // Draw underline if needed
                        if (textEl.underline) {
                            const textWidth = ctx.measureText(line).width;
                            const underlineY = lineY + textEl.fontSize + 2;
                            ctx.strokeStyle = textEl.color;
                            ctx.lineWidth = Math.max(1, textEl.fontSize / 16);
                            ctx.beginPath();
                            ctx.moveTo(textEl.position.x, underlineY);
                            ctx.lineTo(
                                textEl.position.x + textWidth,
                                underlineY
                            );
                            ctx.stroke();
                        }
                    });
                } else if (element.type === "line") {
                    const lineEl = element as LineElement;
                    ctx.strokeStyle = lineEl.color;
                    ctx.lineWidth = lineEl.strokeWidth;
                    ctx.beginPath();
                    ctx.moveTo(lineEl.start.x, lineEl.start.y);
                    ctx.lineTo(lineEl.end.x, lineEl.end.y);
                    ctx.stroke();
                } else if (element.type === "arrow") {
                    const arrowEl = element as ArrowElement;
                    ctx.strokeStyle = arrowEl.color;
                    ctx.fillStyle = arrowEl.color;
                    ctx.lineWidth = arrowEl.strokeWidth;

                    // Draw line
                    const angle = Math.atan2(
                        arrowEl.end.y - arrowEl.start.y,
                        arrowEl.end.x - arrowEl.start.x
                    );
                    const arrowLength = 10;
                    const lineEndX =
                        arrowEl.end.x - arrowLength * 0.8 * Math.cos(angle);
                    const lineEndY =
                        arrowEl.end.y - arrowLength * 0.8 * Math.sin(angle);

                    ctx.beginPath();
                    ctx.moveTo(arrowEl.start.x, arrowEl.start.y);
                    ctx.lineTo(lineEndX, lineEndY);
                    ctx.stroke();

                    // Draw arrow head
                    const arrowAngle = Math.PI / 6;
                    const arrowHead1X =
                        arrowEl.end.x -
                        arrowLength * Math.cos(angle - arrowAngle);
                    const arrowHead1Y =
                        arrowEl.end.y -
                        arrowLength * Math.sin(angle - arrowAngle);
                    const arrowHead2X =
                        arrowEl.end.x -
                        arrowLength * Math.cos(angle + arrowAngle);
                    const arrowHead2Y =
                        arrowEl.end.y -
                        arrowLength * Math.sin(angle + arrowAngle);

                    ctx.beginPath();
                    ctx.moveTo(arrowEl.end.x, arrowEl.end.y);
                    ctx.lineTo(arrowHead1X, arrowHead1Y);
                    ctx.lineTo(arrowHead2X, arrowHead2Y);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
            });

            downloadCanvas(canvas);
        },
        [state.elements]
    );

    const downloadCanvas = (canvas: HTMLCanvasElement) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `whiteboard-${
                    new Date().toISOString().split("T")[0]
                }.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }, "image/png");
    };

    // Take a screenshot for AI chat (returns base64 data URL)
    const takeScreenshot = useCallback(
        (options: { includeGrid?: boolean } = {}): Promise<string> => {
            return new Promise((resolve) => {
                // Use the same export logic but return data URL instead of downloading
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve("");
                    return;
                }

                // Use medium quality for screenshots to balance size and quality
                const scale = 1.5;
                canvas.width = 1920 * scale;
                canvas.height = 1080 * scale;
                ctx.scale(scale, scale);

                // Set white background
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

                if (state.elements.length === 0) {
                    resolve(canvas.toDataURL("image/png"));
                    return;
                }

                // Calculate bounds (same logic as export)
                let minX = Infinity,
                    minY = Infinity,
                    maxX = -Infinity,
                    maxY = -Infinity;
                state.elements.forEach((element) => {
                    if (element.type === "text") {
                        const textEl = element as TextElement;
                        minX = Math.min(minX, textEl.position.x);
                        minY = Math.min(
                            minY,
                            textEl.position.y - textEl.fontSize
                        );
                        maxX = Math.max(
                            maxX,
                            textEl.position.x + (textEl.width || 100)
                        );
                        maxY = Math.max(
                            maxY,
                            textEl.position.y +
                                (textEl.height || textEl.fontSize)
                        );
                    } else if (
                        element.type === "line" ||
                        element.type === "arrow"
                    ) {
                        const lineEl = element as LineElement | ArrowElement;
                        minX = Math.min(minX, lineEl.start.x, lineEl.end.x);
                        minY = Math.min(minY, lineEl.start.y, lineEl.end.y);
                        maxX = Math.max(maxX, lineEl.start.x, lineEl.end.x);
                        maxY = Math.max(maxY, lineEl.start.y, lineEl.end.y);
                    }
                });

                // Add padding and calculate scale
                const padding = 50;
                minX -= padding;
                minY -= padding;
                maxX += padding;
                maxY += padding;
                const contentWidth = maxX - minX;
                const contentHeight = maxY - minY;
                const scaleX = canvas.width / scale / contentWidth;
                const scaleY = canvas.height / scale / contentHeight;
                const exportScale = Math.min(scaleX, scaleY, 1);
                const offsetX =
                    (canvas.width / scale - contentWidth * exportScale) / 2 -
                    minX * exportScale;
                const offsetY =
                    (canvas.height / scale - contentHeight * exportScale) / 2 -
                    minY * exportScale;

                // Draw grid if requested
                if (options.includeGrid) {
                    ctx.save();
                    ctx.translate(offsetX, offsetY);
                    ctx.scale(exportScale, exportScale);
                    const gridSize = 20;
                    ctx.strokeStyle = "#99a8ad";
                    ctx.lineWidth = 1 / exportScale;
                    ctx.globalAlpha = 0.5;
                    const gridMinX =
                        Math.floor((minX - 100) / gridSize) * gridSize;
                    const gridMaxX =
                        Math.ceil((maxX + 100) / gridSize) * gridSize;
                    const gridMinY =
                        Math.floor((minY - 100) / gridSize) * gridSize;
                    const gridMaxY =
                        Math.ceil((maxY + 100) / gridSize) * gridSize;
                    for (let x = gridMinX; x <= gridMaxX; x += gridSize) {
                        ctx.beginPath();
                        ctx.moveTo(x, gridMinY);
                        ctx.lineTo(x, gridMaxY);
                        ctx.stroke();
                    }
                    for (let y = gridMinY; y <= gridMaxY; y += gridSize) {
                        ctx.beginPath();
                        ctx.moveTo(gridMinX, y);
                        ctx.lineTo(gridMaxX, y);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // Render elements (same logic as export but simplified)
                state.elements.forEach((element) => {
                    ctx.save();
                    ctx.translate(offsetX, offsetY);
                    ctx.scale(exportScale, exportScale);

                    if (element.type === "text") {
                        const textEl = element as TextElement;
                        ctx.font = `${textEl.bold ? "bold " : ""}${
                            textEl.italic ? "italic " : ""
                        }${textEl.fontSize}px ${textEl.fontFamily}`;
                        ctx.fillStyle = textEl.color;
                        ctx.textBaseline = "top";
                        const lines = textEl.content.split("\n");
                        lines.forEach((line: string, index: number) => {
                            const lineY =
                                textEl.position.y -
                                textEl.fontSize +
                                index * textEl.fontSize * 1.2;
                            ctx.fillText(line, textEl.position.x, lineY);
                            if (textEl.underline) {
                                const textWidth = ctx.measureText(line).width;
                                const underlineY = lineY + textEl.fontSize + 2;
                                ctx.strokeStyle = textEl.color;
                                ctx.lineWidth = Math.max(
                                    1,
                                    textEl.fontSize / 16
                                );
                                ctx.beginPath();
                                ctx.moveTo(textEl.position.x, underlineY);
                                ctx.lineTo(
                                    textEl.position.x + textWidth,
                                    underlineY
                                );
                                ctx.stroke();
                            }
                        });
                    } else if (element.type === "line") {
                        const lineEl = element as LineElement;
                        ctx.strokeStyle = lineEl.color;
                        ctx.lineWidth = lineEl.strokeWidth;
                        ctx.beginPath();
                        ctx.moveTo(lineEl.start.x, lineEl.start.y);
                        ctx.lineTo(lineEl.end.x, lineEl.end.y);
                        ctx.stroke();
                    } else if (element.type === "arrow") {
                        const arrowEl = element as ArrowElement;
                        ctx.strokeStyle = arrowEl.color;
                        ctx.fillStyle = arrowEl.color;
                        ctx.lineWidth = arrowEl.strokeWidth;
                        const angle = Math.atan2(
                            arrowEl.end.y - arrowEl.start.y,
                            arrowEl.end.x - arrowEl.start.x
                        );
                        const arrowLength = 10;
                        const lineEndX =
                            arrowEl.end.x - arrowLength * 0.8 * Math.cos(angle);
                        const lineEndY =
                            arrowEl.end.y - arrowLength * 0.8 * Math.sin(angle);
                        ctx.beginPath();
                        ctx.moveTo(arrowEl.start.x, arrowEl.start.y);
                        ctx.lineTo(lineEndX, lineEndY);
                        ctx.stroke();
                        const arrowAngle = Math.PI / 6;
                        const arrowHead1X =
                            arrowEl.end.x -
                            arrowLength * Math.cos(angle - arrowAngle);
                        const arrowHead1Y =
                            arrowEl.end.y -
                            arrowLength * Math.sin(angle - arrowAngle);
                        const arrowHead2X =
                            arrowEl.end.x -
                            arrowLength * Math.cos(angle + arrowAngle);
                        const arrowHead2Y =
                            arrowEl.end.y -
                            arrowLength * Math.sin(angle + arrowAngle);
                        ctx.beginPath();
                        ctx.moveTo(arrowEl.end.x, arrowEl.end.y);
                        ctx.lineTo(arrowHead1X, arrowHead1Y);
                        ctx.lineTo(arrowHead2X, arrowHead2Y);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                });

                resolve(canvas.toDataURL("image/png"));
            });
        },
        [state.elements]
    );

    // LLM Action functions
    const gotoPosition = useCallback(
        (x: number, y: number, scale: number) => {
            updateViewBox({
                x: x - window.innerWidth / 2 / scale,
                y: y - window.innerHeight / 2 / scale,
                zoom: scale,
            });
        },
        [updateViewBox]
    );

    const gotoElement = useCallback(
        (uuid: string, scale: number) => {
            const element = state.elements.find((el) => el.id === uuid);
            if (!element) {
                console.warn(`Element with UUID ${uuid} not found`);
                return;
            }

            // Calculate element center
            let centerX: number, centerY: number;

            if (element.type === "text") {
                centerX = element.position.x + (element.width || 100) / 2;
                centerY = element.position.y;
            } else if (element.type === "line" || element.type === "arrow") {
                centerX = (element.start.x + element.end.x) / 2;
                centerY = (element.start.y + element.end.y) / 2;
            } else {
                centerX = 0;
                centerY = 0;
            }

            // Navigate to element center
            gotoPosition(centerX, centerY, scale);
        },
        [state.elements, gotoPosition]
    );

    const createElement = useCallback(
        (element: WhiteboardElement) => {
            addElement(element);
        },
        [addElement]
    );

    const deleteElement = useCallback((uuid: string) => {
        setState((prev) => ({
            ...prev,
            elements: prev.elements.filter((el) => el.id !== uuid),
        }));
    }, []);

    return {
        state,
        activeTool,
        setActiveTool,
        isDrawing,
        setIsDrawing,
        currentElement,
        setCurrentElement,
        addElement,
        updateElement,
        removeElement,
        clearCanvas,
        updateViewBox,
        zoomIn,
        zoomOut,
        resetView,
        pan,
        screenToCanvas,
        canvasToScreen,
        undo,
        redo,
        canUndo,
        canRedo,
        currentStyles,
        updateCurrentStyles,
        exportToJSON,
        importFromJSON,
        exportToPNG,
        takeScreenshot,
        // LLM Actions
        gotoPosition,
        gotoElement,
        createElement,
        deleteElement,
    };
};
