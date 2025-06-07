"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { Toolbar } from "./Toolbar";
import { ContextToolbar } from "./ContextToolbar";
import { ChatPopup } from "./ChatPopup";
import {
    WhiteboardElement,
    Point,
    TextElement,
    LineElement,
    ArrowElement,
} from "@/types/whiteboard";
import { snapToGrid, shouldSnapToGrid } from "@/utils/grid";

export const Whiteboard = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
    const [draggedElement, setDraggedElement] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
    const [draggedLinePoint, setDraggedLinePoint] = useState<
        "start" | "end" | "body" | null
    >(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
        null
    );
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStartPos, setResizeStartPos] = useState<Point>({ x: 0, y: 0 });
    const [resizeStartBounds, setResizeStartBounds] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });
    const [showGrid] = useState(true);
    const [gridSnapping] = useState(true);
    const [isCreatingTextBox, setIsCreatingTextBox] = useState(false);
    const [textBoxStartPos, setTextBoxStartPos] = useState<Point>({
        x: 0,
        y: 0,
    });
    // Add state for chat popup
    const [isChatOpen, setIsChatOpen] = useState(false);

    const {
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
        zoomIn,
        zoomOut,
        resetView,
        pan,
        screenToCanvas,
        saveToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        currentStyles,
        updateCurrentStyles,
    } = useWhiteboard();

    const generateId = () => {
        // Use timestamp + random for better uniqueness
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `${timestamp}-${random}`;
    };

    const getTextElementBounds = useCallback((textEl: TextElement) => {
        const width = textEl.width || Math.max(textEl.content.length * 8, 100);
        const height = textEl.height || textEl.fontSize + 10;
        return {
            x: textEl.position.x,
            y: textEl.position.y - textEl.fontSize,
            width,
            height,
        };
    }, []);

    const isPointInTextElement = useCallback(
        (point: Point, textEl: TextElement): boolean => {
            const bounds = getTextElementBounds(textEl);
            return (
                point.x >= bounds.x &&
                point.x <= bounds.x + bounds.width &&
                point.y >= bounds.y &&
                point.y <= bounds.y + bounds.height
            );
        },
        [getTextElementBounds]
    );

    const applyGridSnapping = useCallback(
        (point: Point): Point => {
            return gridSnapping && showGrid && shouldSnapToGrid(point)
                ? snapToGrid(point)
                : point;
        },
        [gridSnapping, showGrid]
    );

    const distanceToLine = useCallback(
        (point: Point, start: Point, end: Point): number => {
            const A = point.x - start.x;
            const B = point.y - start.y;
            const C = end.x - start.x;
            const D = end.y - start.y;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) {
                param = dot / lenSq;
            }

            let xx, yy;
            if (param < 0) {
                xx = start.x;
                yy = start.y;
            } else if (param > 1) {
                xx = end.x;
                yy = end.y;
            } else {
                xx = start.x + param * C;
                yy = start.y + param * D;
            }

            const dx = point.x - xx;
            const dy = point.y - yy;
            return Math.sqrt(dx * dx + dy * dy);
        },
        []
    );

    const isPointNearLine = useCallback(
        (
            point: Point,
            lineEl: LineElement | ArrowElement,
            threshold: number = 8
        ): boolean => {
            return distanceToLine(point, lineEl.start, lineEl.end) <= threshold;
        },
        [distanceToLine]
    );

    const getLinePointType = useCallback(
        (
            point: Point,
            lineEl: LineElement | ArrowElement
        ): "start" | "end" | "body" | null => {
            // Check if clicking on start point handle
            const startDistance = Math.sqrt(
                Math.pow(point.x - lineEl.start.x, 2) +
                    Math.pow(point.y - lineEl.start.y, 2)
            );
            if (startDistance <= 8) return "start";

            // Check if clicking on end point handle
            const endDistance = Math.sqrt(
                Math.pow(point.x - lineEl.end.x, 2) +
                    Math.pow(point.y - lineEl.end.y, 2)
            );
            if (endDistance <= 8) return "end";

            // Check if clicking on line body
            if (isPointNearLine(point, lineEl)) return "body";

            return null;
        },
        [isPointNearLine]
    );

    const isPointOnResizeHandle = useCallback(
        (point: Point, textEl: TextElement): boolean => {
            const bounds = getTextElementBounds(textEl);
            const handleX = bounds.x + bounds.width;
            const handleY = bounds.y + bounds.height;
            const distance = Math.sqrt(
                Math.pow(point.x - handleX, 2) + Math.pow(point.y - handleY, 2)
            );
            return distance <= 8; // 8px threshold for resize handle
        },
        [getTextElementBounds]
    );

    const getMousePosition = useCallback((event: React.MouseEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }, []);

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
            const mousePos = getMousePosition(event);
            const canvasPos = screenToCanvas(mousePos);

            // Check for right-click - enable panning regardless of tool
            if (event.button === 2) {
                setIsPanning(true);
                setLastPanPoint(mousePos);
                return;
            }

            // First, check if clicking on an existing element (for any tool)
            const clickedElement = state.elements.find((element) => {
                if (element.type === "text") {
                    const textEl = element as TextElement;
                    return isPointInTextElement(canvasPos, textEl);
                } else if (
                    element.type === "line" ||
                    element.type === "arrow"
                ) {
                    const lineEl = element as LineElement | ArrowElement;
                    return getLinePointType(canvasPos, lineEl) !== null;
                }
                return false;
            });

            // If we clicked on an element
            if (clickedElement) {
                // Check if we're clicking on a resize handle for text elements
                if (
                    clickedElement.type === "text" &&
                    selectedElementId === clickedElement.id
                ) {
                    const textEl = clickedElement as TextElement;
                    if (isPointOnResizeHandle(canvasPos, textEl)) {
                        // Start resizing
                        setIsResizing(true);
                        setResizeStartPos(canvasPos);
                        const bounds = getTextElementBounds(textEl);
                        setResizeStartBounds({
                            width: bounds.width,
                            height: bounds.height,
                        });
                        return;
                    }
                }

                // For text tool, just select the element (don't create new text)
                if (activeTool === "text" || activeTool === "select") {
                    setSelectedElementId(clickedElement.id);
                    setDraggedElement(clickedElement.id);

                    if (clickedElement.type === "text") {
                        const textEl = clickedElement as TextElement;
                        setDragOffset({
                            x: canvasPos.x - textEl.position.x,
                            y: canvasPos.y - textEl.position.y,
                        });
                    } else if (
                        clickedElement.type === "line" ||
                        clickedElement.type === "arrow"
                    ) {
                        const lineEl = clickedElement as
                            | LineElement
                            | ArrowElement;
                        const pointType = getLinePointType(canvasPos, lineEl);
                        setDraggedLinePoint(pointType);

                        if (pointType === "body") {
                            // For body dragging, calculate offset from start point
                            setDragOffset({
                                x: canvasPos.x - lineEl.start.x,
                                y: canvasPos.y - lineEl.start.y,
                            });
                        }
                    }
                    return;
                }
                // For other tools, still allow selection but don't create new elements
                setSelectedElementId(clickedElement.id);
                return;
            }

            // If we didn't click on an element, handle based on active tool
            if (activeTool === "select") {
                // Clear selection and start panning
                setSelectedElementId(null);
                setIsPanning(true);
                setLastPanPoint(mousePos);
                return;
            }

            // Handle tool-specific actions for empty space
            setIsDrawing(true);

            if (activeTool === "text") {
                // Start creating text box by dragging
                const snappedPos = applyGridSnapping(canvasPos);
                setIsCreatingTextBox(true);
                setTextBoxStartPos(snappedPos);
            } else if (activeTool === "line" || activeTool === "arrow") {
                const snappedPos = applyGridSnapping(canvasPos);
                const lineElement: LineElement | ArrowElement = {
                    id: generateId(),
                    type: activeTool,
                    start: snappedPos,
                    end: snappedPos,
                    strokeWidth: currentStyles.strokeWidth,
                    color: currentStyles.lineColor,
                };
                setCurrentElement(lineElement);
            }
        },
        [
            activeTool,
            getMousePosition,
            screenToCanvas,
            state.elements,
            selectedElementId,
            isPointOnResizeHandle,
            setIsResizing,
            setResizeStartPos,
            setResizeStartBounds,
            getTextElementBounds,
            setSelectedElementId,
            setDraggedElement,
            setDragOffset,
            setIsPanning,
            setLastPanPoint,
            setIsDrawing,
            applyGridSnapping,
            setIsCreatingTextBox,
            setTextBoxStartPos,
            setCurrentElement,
            isPointInTextElement,
            getLinePointType,
            setDraggedLinePoint,
            currentStyles.strokeWidth,
            currentStyles.lineColor,
        ]
    );

    const handleDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            const mousePos = getMousePosition(event);
            const canvasPos = screenToCanvas(mousePos);

            // Find text element under cursor for editing
            const clickedTextElement = state.elements.find((element) => {
                if (element.type === "text") {
                    const textEl = element as TextElement;
                    return isPointInTextElement(canvasPos, textEl);
                }
                return false;
            }) as TextElement | undefined;

            if (clickedTextElement) {
                setEditingTextId(clickedTextElement.id);
                setSelectedElementId(clickedTextElement.id);
            }
        },
        [
            getMousePosition,
            screenToCanvas,
            state.elements,
            setEditingTextId,
            setSelectedElementId,
            isPointInTextElement,
        ]
    );

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
            const cmdKey = isMac ? event.metaKey : event.ctrlKey;

            // Tool shortcuts
            if (!editingTextId && !cmdKey) {
                switch (event.key.toLowerCase()) {
                    case "v":
                        event.preventDefault();
                        setActiveTool("select");
                        break;
                    case "t":
                        event.preventDefault();
                        setActiveTool("text");
                        break;
                    case "f":
                        event.preventDefault();
                        setActiveTool("arrow");
                        break;
                    case "r":
                        event.preventDefault();
                        setActiveTool("line");
                        break;
                }
            }

            // Command/Ctrl shortcuts
            if (cmdKey) {
                switch (event.key.toLowerCase()) {
                    case "z":
                        event.preventDefault();
                        if (event.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                        break;
                    case "=":
                    case "+":
                        event.preventDefault();
                        if (svgRef.current) {
                            const rect = svgRef.current.getBoundingClientRect();
                            const centerPoint = {
                                x:
                                    state.viewBox.x +
                                    (rect.width * 0.5) / state.viewBox.zoom,
                                y:
                                    state.viewBox.y +
                                    (rect.height * 0.5) / state.viewBox.zoom,
                            };
                            zoomIn(centerPoint, true);
                        }
                        break;
                    case "-":
                        event.preventDefault();
                        if (svgRef.current) {
                            const rect = svgRef.current.getBoundingClientRect();
                            const centerPoint = {
                                x:
                                    state.viewBox.x +
                                    (rect.width * 0.5) / state.viewBox.zoom,
                                y:
                                    state.viewBox.y +
                                    (rect.height * 0.5) / state.viewBox.zoom,
                            };
                            zoomOut(centerPoint, true);
                        }
                        break;
                    case "0":
                        event.preventDefault();
                        resetView();
                        break;
                }
            }

            // Delete key
            if (event.key === "Delete" && selectedElementId && !editingTextId) {
                removeElement(selectedElementId);
                setSelectedElementId(null);
                saveToHistory();
            }

            // Escape to cancel text editing
            if (event.key === "Escape" && editingTextId) {
                setEditingTextId(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        editingTextId,
        removeElement,
        redo,
        resetView,
        saveToHistory,
        selectedElementId,
        setActiveTool,
        setEditingTextId,
        setSelectedElementId,
        undo,
        zoomIn,
        zoomOut,
        state.viewBox.x,
        state.viewBox.y,
        state.viewBox.zoom,
    ]);

    const handleMouseMove = useCallback(
        (event: React.MouseEvent) => {
            const mousePos = getMousePosition(event);
            const canvasPos = screenToCanvas(mousePos);

            if (isCreatingTextBox) {
                // Handle text box creation by dragging
                const snappedEnd = applyGridSnapping(canvasPos);
                const width = Math.abs(snappedEnd.x - textBoxStartPos.x);
                const height = Math.abs(snappedEnd.y - textBoxStartPos.y);

                if (width > 10 && height > 10) {
                    // Show preview of text box being created
                    const previewElement: TextElement = {
                        id: "preview",
                        type: "text",
                        position: {
                            x: Math.min(textBoxStartPos.x, snappedEnd.x),
                            y: Math.min(textBoxStartPos.y, snappedEnd.y),
                        },
                        content: "Text Box",
                        fontSize: currentStyles.fontSize,
                        fontFamily: currentStyles.fontFamily,
                        color: currentStyles.color,
                        bold: currentStyles.bold,
                        italic: currentStyles.italic,
                        underline: currentStyles.underline,
                        width: width,
                        height: height,
                    };
                    setCurrentElement(previewElement);
                }
                return;
            }

            if (isResizing && selectedElementId) {
                // Handle resizing
                const deltaX = canvasPos.x - resizeStartPos.x;
                const deltaY = canvasPos.y - resizeStartPos.y;
                const newWidth = Math.max(50, resizeStartBounds.width + deltaX);
                const newHeight = Math.max(
                    20,
                    resizeStartBounds.height + deltaY
                );

                updateElement(selectedElementId, {
                    width: newWidth,
                    height: newHeight,
                });
                return;
            }

            if (draggedElement) {
                const element = state.elements.find(
                    (el) => el.id === draggedElement
                );

                if (element && element.type === "text") {
                    const newPos = {
                        x: canvasPos.x - dragOffset.x,
                        y: canvasPos.y - dragOffset.y,
                    };
                    const snappedPos = applyGridSnapping(newPos);
                    updateElement(draggedElement, {
                        position: snappedPos,
                    });
                } else if (
                    element &&
                    (element.type === "line" || element.type === "arrow")
                ) {
                    const lineEl = element as LineElement | ArrowElement;
                    const snappedPos = applyGridSnapping(canvasPos);

                    if (draggedLinePoint === "start") {
                        updateElement(draggedElement, {
                            start: snappedPos,
                        });
                    } else if (draggedLinePoint === "end") {
                        updateElement(draggedElement, {
                            end: snappedPos,
                        });
                    } else if (draggedLinePoint === "body") {
                        // Move both points by the same offset
                        const deltaX =
                            canvasPos.x - dragOffset.x - lineEl.start.x;
                        const deltaY =
                            canvasPos.y - dragOffset.y - lineEl.start.y;

                        const newStart = applyGridSnapping({
                            x: lineEl.start.x + deltaX,
                            y: lineEl.start.y + deltaY,
                        });
                        const newEnd = applyGridSnapping({
                            x: lineEl.end.x + deltaX,
                            y: lineEl.end.y + deltaY,
                        });

                        updateElement(draggedElement, {
                            start: newStart,
                            end: newEnd,
                        });
                    }
                }
                return;
            }

            if (isPanning) {
                const deltaX = mousePos.x - lastPanPoint.x;
                const deltaY = mousePos.y - lastPanPoint.y;
                pan(deltaX, deltaY);
                setLastPanPoint(mousePos);
                return;
            }

            if (
                isDrawing &&
                currentElement &&
                (activeTool === "line" || activeTool === "arrow")
            ) {
                // Type assertion since we know it's a line or arrow element
                const lineElement = currentElement as
                    | LineElement
                    | ArrowElement;
                const snappedEnd = applyGridSnapping(canvasPos);
                setCurrentElement({
                    ...lineElement,
                    end: snappedEnd,
                });
            }
        },
        [
            getMousePosition,
            screenToCanvas,
            isCreatingTextBox,
            applyGridSnapping,
            textBoxStartPos,
            setCurrentElement,
            isResizing,
            selectedElementId,
            resizeStartPos,
            resizeStartBounds,
            updateElement,
            draggedElement,
            dragOffset,
            isPanning,
            lastPanPoint,
            pan,
            setLastPanPoint,
            isDrawing,
            currentElement,
            activeTool,
            state.elements,
            draggedLinePoint,
            currentStyles.fontSize,
            currentStyles.fontFamily,
            currentStyles.color,
            currentStyles.bold,
            currentStyles.italic,
            currentStyles.underline,
        ]
    );

    const handleMouseUp = useCallback(() => {
        if (isCreatingTextBox) {
            // Finalize text box creation
            if (
                currentElement &&
                currentElement.type === "text" &&
                currentElement.width &&
                currentElement.height &&
                currentElement.width > 10 &&
                currentElement.height > 10
            ) {
                const textEl = currentElement as TextElement;
                const finalTextElement: TextElement = {
                    ...textEl,
                    id: generateId(),
                    content: "Double-click to edit",
                };
                addElement(finalTextElement);
                setEditingTextId(finalTextElement.id);
                setSelectedElementId(finalTextElement.id);
            }
            setIsCreatingTextBox(false);
            setCurrentElement(null);
            setIsDrawing(false);
            return;
        }

        if (isResizing) {
            setIsResizing(false);
            return;
        }

        if (draggedElement) {
            setDraggedElement(null);
            setDragOffset({ x: 0, y: 0 });
            setDraggedLinePoint(null);
            return;
        }

        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (isDrawing && currentElement) {
            addElement(currentElement);
            setCurrentElement(null);
        }

        setIsDrawing(false);
    }, [
        isCreatingTextBox,
        currentElement,
        addElement,
        setEditingTextId,
        setSelectedElementId,
        setIsCreatingTextBox,
        setCurrentElement,
        setIsDrawing,
        isResizing,
        draggedElement,
        isPanning,
        isDrawing,
        setDraggedElement,
        setDragOffset,
        setIsPanning,
        setIsResizing,
    ]);

    const handleWheel = useCallback(
        (event: React.WheelEvent) => {
            event.preventDefault();
            if (!svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            // Calculate the cursor position in canvas coordinates
            const cursorPoint = {
                x:
                    state.viewBox.x +
                    (event.clientX - rect.left) / state.viewBox.zoom,
                y:
                    state.viewBox.y +
                    (event.clientY - rect.top) / state.viewBox.zoom,
            };

            if (event.deltaY < 0) {
                zoomIn(cursorPoint);
            } else {
                zoomOut(cursorPoint);
            }
        },
        [zoomIn, zoomOut, state.viewBox]
    );

    const renderElement = (element: WhiteboardElement) => {
        if (element.type === "text") {
            const textEl = element as TextElement;
            const bounds = getTextElementBounds(textEl);
            const isSelected = selectedElementId === element.id;
            const isEditing = editingTextId === element.id;
            const isPreview = element.id === "preview";

            return (
                <g key={element.id}>
                    {/* Selection background or preview outline */}
                    {((isSelected && !isEditing) || isPreview) && (
                        <rect
                            x={bounds.x - 2}
                            y={bounds.y - 2}
                            width={bounds.width + 4}
                            height={bounds.height + 4}
                            fill={
                                isPreview
                                    ? "rgba(59, 130, 246, 0.05)"
                                    : "rgba(59, 130, 246, 0.1)"
                            }
                            stroke="rgb(59, 130, 246)"
                            strokeWidth={isPreview ? "2" : "1"}
                            strokeDasharray={isPreview ? "3,3" : "4,2"}
                            className="pointer-events-none"
                        />
                    )}

                    {/* Text element - hide when editing */}
                    {!isEditing && (
                        <foreignObject
                            x={textEl.position.x}
                            y={textEl.position.y - textEl.fontSize}
                            width={bounds.width}
                            height={bounds.height}
                            className="cursor-move select-none"
                        >
                            <div
                                style={{
                                    fontSize: textEl.fontSize,
                                    fontFamily: textEl.fontFamily,
                                    fontWeight: textEl.bold ? "bold" : "normal",
                                    fontStyle: textEl.italic
                                        ? "italic"
                                        : "normal",
                                    textDecoration: textEl.underline
                                        ? "underline"
                                        : "none",
                                    color: isPreview ? "#666666" : textEl.color,
                                    width: "100%",
                                    height: "100%",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    overflow: "hidden",
                                    padding: "2px",
                                    opacity: isPreview ? 0.7 : 1,
                                }}
                            >
                                {textEl.content}
                            </div>
                        </foreignObject>
                    )}

                    {/* Resize handles when selected */}
                    {isSelected && !isEditing && !isPreview && (
                        <>
                            <circle
                                cx={bounds.x + bounds.width}
                                cy={bounds.y + bounds.height}
                                r="4"
                                fill="rgb(59, 130, 246)"
                                className="cursor-se-resize"
                            />
                        </>
                    )}
                </g>
            );
        }

        if (element.type === "line") {
            const lineEl = element as LineElement;
            const isSelected = selectedElementId === element.id;

            return (
                <g key={element.id}>
                    <line
                        x1={lineEl.start.x}
                        y1={lineEl.start.y}
                        x2={lineEl.end.x}
                        y2={lineEl.end.y}
                        stroke={lineEl.color}
                        strokeWidth={lineEl.strokeWidth}
                        className={
                            isSelected ? "cursor-move" : "pointer-events-none"
                        }
                        style={{ pointerEvents: isSelected ? "auto" : "none" }}
                    />

                    {/* Selection handles */}
                    {isSelected && (
                        <>
                            <circle
                                cx={lineEl.start.x}
                                cy={lineEl.start.y}
                                r="6"
                                fill="rgb(59, 130, 246)"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-move pointer-events-auto"
                                style={{ pointerEvents: "auto" }}
                            />
                            <circle
                                cx={lineEl.end.x}
                                cy={lineEl.end.y}
                                r="6"
                                fill="rgb(59, 130, 246)"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-move pointer-events-auto"
                                style={{ pointerEvents: "auto" }}
                            />
                        </>
                    )}
                </g>
            );
        }

        if (element.type === "arrow") {
            const arrowEl = element as ArrowElement;
            const isSelected = selectedElementId === element.id;
            const angle = Math.atan2(
                arrowEl.end.y - arrowEl.start.y,
                arrowEl.end.x - arrowEl.start.x
            );
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6;

            // Calculate arrow head points
            const arrowHead1 = {
                x: arrowEl.end.x - arrowLength * Math.cos(angle - arrowAngle),
                y: arrowEl.end.y - arrowLength * Math.sin(angle - arrowAngle),
            };

            const arrowHead2 = {
                x: arrowEl.end.x - arrowLength * Math.cos(angle + arrowAngle),
                y: arrowEl.end.y - arrowLength * Math.sin(angle + arrowAngle),
            };

            // Calculate the line end point (shortened to stop at arrow base)
            const lineEndX =
                arrowEl.end.x - arrowLength * 0.8 * Math.cos(angle);
            const lineEndY =
                arrowEl.end.y - arrowLength * 0.8 * Math.sin(angle);

            return (
                <g key={element.id}>
                    <line
                        x1={arrowEl.start.x}
                        y1={arrowEl.start.y}
                        x2={lineEndX}
                        y2={lineEndY}
                        stroke={arrowEl.color}
                        strokeWidth={arrowEl.strokeWidth}
                        className={
                            isSelected ? "cursor-move" : "pointer-events-none"
                        }
                        style={{ pointerEvents: isSelected ? "auto" : "none" }}
                    />
                    <polygon
                        points={`${arrowEl.end.x},${arrowEl.end.y} ${arrowHead1.x},${arrowHead1.y} ${arrowHead2.x},${arrowHead2.y}`}
                        fill={arrowEl.color}
                        className={
                            isSelected ? "cursor-move" : "pointer-events-none"
                        }
                        style={{ pointerEvents: isSelected ? "auto" : "none" }}
                    />

                    {/* Selection handles */}
                    {isSelected && (
                        <>
                            <circle
                                cx={arrowEl.start.x}
                                cy={arrowEl.start.y}
                                r="6"
                                fill="rgb(59, 130, 246)"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-move pointer-events-auto"
                                style={{ pointerEvents: "auto" }}
                            />
                            <circle
                                cx={arrowEl.end.x}
                                cy={arrowEl.end.y}
                                r="6"
                                fill="rgb(59, 130, 246)"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-move pointer-events-auto"
                                style={{ pointerEvents: "auto" }}
                            />
                        </>
                    )}
                </g>
            );
        }

        return null;
    };

    // Text editing overlay component
    const renderTextEditor = () => {
        if (!editingTextId) return null;

        const textElement = state.elements.find(
            (el) => el.id === editingTextId
        ) as TextElement;
        if (!textElement) return null;

        const bounds = getTextElementBounds(textElement);
        const screenPos = {
            x: (textElement.position.x - state.viewBox.x) * state.viewBox.zoom,
            y:
                (textElement.position.y - state.viewBox.y) *
                    state.viewBox.zoom -
                textElement.fontSize * state.viewBox.zoom,
        };

        return (
            <div
                style={{
                    position: "absolute",
                    left: screenPos.x,
                    top: screenPos.y,
                    width: bounds.width * state.viewBox.zoom,
                    height: bounds.height * state.viewBox.zoom,
                    zIndex: 1000,
                }}
            >
                <textarea
                    value={textElement.content}
                    onChange={(e) => {
                        const textarea = e.target as HTMLTextAreaElement;
                        const content = e.target.value;

                        // Auto-resize height based on content
                        textarea.style.height = "auto";
                        const newHeight = Math.max(
                            bounds.height,
                            textarea.scrollHeight / state.viewBox.zoom
                        );

                        updateElement(editingTextId, {
                            content: content,
                            height: newHeight,
                        });

                        // Update textarea height
                        textarea.style.height =
                            newHeight * state.viewBox.zoom + "px";
                    }}
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            setEditingTextId(null);
                        }
                    }}
                    autoFocus
                    style={{
                        width: "100%",
                        minHeight: bounds.height * state.viewBox.zoom,
                        border: "1px solid rgb(59, 130, 246)",
                        borderRadius: "2px",
                        padding: "2px",
                        fontSize: textElement.fontSize * state.viewBox.zoom,
                        fontFamily: textElement.fontFamily,
                        fontWeight: textElement.bold ? "bold" : "normal",
                        fontStyle: textElement.italic ? "italic" : "normal",
                        textDecoration: textElement.underline
                            ? "underline"
                            : "none",
                        color: textElement.color,
                        background: "white",
                        resize: "none",
                        outline: "none",
                        overflow: "hidden",
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                    }}
                />
            </div>
        );
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gray-50">
            {/* Context-sensitive top toolbar */}
            <ContextToolbar
                activeTool={activeTool}
                selectedElementId={selectedElementId}
                selectedElementType={
                    selectedElementId
                        ? state.elements.find(
                              (el) => el.id === selectedElementId
                          )?.type
                        : undefined
                }
                selectedElement={
                    selectedElementId
                        ? state.elements.find(
                              (el) => el.id === selectedElementId
                          )
                        : null
                }
                onUpdateElement={updateElement}
                currentStyles={currentStyles}
                onUpdateCurrentStyles={updateCurrentStyles}
            />

            {/* Main bottom toolbar */}
            <Toolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onZoomIn={() => {
                    if (svgRef.current) {
                        const rect = svgRef.current.getBoundingClientRect();
                        const centerPoint = {
                            x:
                                state.viewBox.x +
                                (rect.width * 0.5) / state.viewBox.zoom,
                            y:
                                state.viewBox.y +
                                (rect.height * 0.5) / state.viewBox.zoom,
                        };
                        zoomIn(centerPoint, true);
                    }
                }}
                onZoomOut={() => {
                    if (svgRef.current) {
                        const rect = svgRef.current.getBoundingClientRect();
                        const centerPoint = {
                            x:
                                state.viewBox.x +
                                (rect.width * 0.5) / state.viewBox.zoom,
                            y:
                                state.viewBox.y +
                                (rect.height * 0.5) / state.viewBox.zoom,
                        };
                        zoomOut(centerPoint, true);
                    }
                }}
                onResetView={resetView}
                onClearCanvas={clearCanvas}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                zoom={state.viewBox.zoom}
                onChatOpen={() => setIsChatOpen(!isChatOpen)}
            />

            {/* Chat popup */}
            <ChatPopup
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />

            {/* Rest of your component */}
            <svg
                ref={svgRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    cursor: isPanning
                        ? "grabbing"
                        : activeTool === "select"
                        ? "grab"
                        : "crosshair",
                }}
            >
                {showGrid && (
                    <>
                        <defs>
                            <pattern
                                id="grid"
                                width={20 * state.viewBox.zoom}
                                height={20 * state.viewBox.zoom}
                                patternUnits="userSpaceOnUse"
                                x={
                                    ((-state.viewBox.x || 0) *
                                        state.viewBox.zoom) %
                                    (20 * state.viewBox.zoom)
                                }
                                y={
                                    ((-state.viewBox.y || 0) *
                                        state.viewBox.zoom) %
                                    (20 * state.viewBox.zoom)
                                }
                            >
                                <path
                                    d={`M ${
                                        20 * state.viewBox.zoom
                                    } 0 L 0 0 0 ${20 * state.viewBox.zoom}`}
                                    fill="none"
                                    stroke="#99a8ad"
                                    strokeWidth="1"
                                    opacity="0.5"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </>
                )}

                <g
                    transform={`translate(${
                        -state.viewBox.x * state.viewBox.zoom
                    }, ${-state.viewBox.y * state.viewBox.zoom}) scale(${
                        state.viewBox.zoom
                    })`}
                >
                    {state.elements.map(renderElement)}
                    {currentElement &&
                        !state.elements.some(
                            (el) => el.id === currentElement.id
                        ) &&
                        renderElement(currentElement)}
                </g>
            </svg>

            {/* Text editing overlay */}
            {renderTextEditor()}
        </div>
    );
};
