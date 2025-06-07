"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    WhiteboardState,
    WhiteboardElement,
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
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        saveWhiteboardState(state);
    }, [state]);

    const addElement = useCallback((element: WhiteboardElement) => {
        setState((prev) => ({
            ...prev,
            elements: [...prev.elements, element],
        }));
    }, []);

    const updateElement = useCallback(
        (id: string, updates: Record<string, unknown>) => {
            setState((prev) => ({
                ...prev,
                elements: prev.elements.map((el) =>
                    el.id === id
                        ? ({ ...el, ...updates } as WhiteboardElement)
                        : el
                ),
            }));
        },
        []
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

    const removeElement = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            elements: prev.elements.filter((el) => el.id !== id),
        }));
    }, []);

    const clearCanvas = useCallback(() => {
        setState((prev) => ({
            ...prev,
            elements: [],
        }));
    }, []);

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

    // Save current state to history
    const saveToHistory = useCallback(() => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push([...state.elements]);
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, [historyIndex, state.elements]);

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
        saveToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        currentStyles,
        updateCurrentStyles,
    };
};
