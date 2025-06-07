'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { Toolbar } from './Toolbar';
import { WhiteboardElement, Point, TextElement, LineElement, ArrowElement } from '@/types/whiteboard';

export const Whiteboard = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

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
    clearCanvas,
    zoomIn,
    zoomOut,
    resetView,
    pan,
    screenToCanvas,
  } = useWhiteboard();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getMousePosition = useCallback((event: React.MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const mousePos = getMousePosition(event);
    const canvasPos = screenToCanvas(mousePos);

    // Check if clicking on an existing element for dragging
    if (activeTool === 'select') {
      const clickedElement = state.elements.find(element => {
        if (element.type === 'text') {
          const textEl = element as TextElement;
          return (
            canvasPos.x >= textEl.position.x - 10 &&
            canvasPos.x <= textEl.position.x + 100 &&
            canvasPos.y >= textEl.position.y - 10 &&
            canvasPos.y <= textEl.position.y + 20
          );
        }
        return false;
      });

      if (clickedElement) {
        setDraggedElement(clickedElement.id);
        if (clickedElement.type === 'text') {
          const textEl = clickedElement as TextElement;
          setDragOffset({
            x: canvasPos.x - textEl.position.x,
            y: canvasPos.y - textEl.position.y,
          });
        }
        return;
      }

      // Start panning if not clicking on an element
      setIsPanning(true);
      setLastPanPoint(mousePos);
      return;
    }

    // Handle tool-specific actions
    setIsDrawing(true);

    if (activeTool === 'text') {
      const textElement: TextElement = {
        id: generateId(),
        type: 'text',
        position: canvasPos,
        content: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
      };
      addElement(textElement);
      setCurrentElement(textElement);
    } else if (activeTool === 'line' || activeTool === 'arrow') {
      const lineElement: LineElement | ArrowElement = {
        id: generateId(),
        type: activeTool,
        start: canvasPos,
        end: canvasPos,
        strokeWidth: 2,
        color: '#000000',
      };
      setCurrentElement(lineElement);
    }
  }, [activeTool, getMousePosition, screenToCanvas, state.elements, addElement]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const mousePos = getMousePosition(event);
    const canvasPos = screenToCanvas(mousePos);

    if (draggedElement) {
      const element = state.elements.find(el => el.id === draggedElement);
      if (element && element.type === 'text') {
        updateElement(draggedElement, {
          position: {
            x: canvasPos.x - dragOffset.x,
            y: canvasPos.y - dragOffset.y,
          },
        });
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

    if (isDrawing && currentElement && (activeTool === 'line' || activeTool === 'arrow')) {
      setCurrentElement({
        ...currentElement,
        end: canvasPos,
      });
    }
  }, [
    getMousePosition,
    screenToCanvas,
    draggedElement,
    dragOffset,
    updateElement,
    isPanning,
    lastPanPoint,
    pan,
    isDrawing,
    currentElement,
    activeTool,
    state.elements,
  ]);

  const handleMouseUp = useCallback(() => {
    if (draggedElement) {
      setDraggedElement(null);
      setDragOffset({ x: 0, y: 0 });
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
  }, [draggedElement, isPanning, isDrawing, currentElement, addElement]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  const renderElement = (element: WhiteboardElement) => {
    if (element.type === 'text') {
      const textEl = element as TextElement;
      return (
        <text
          key={element.id}
          x={textEl.position.x}
          y={textEl.position.y}
          fontSize={textEl.fontSize}
          fontFamily={textEl.fontFamily}
          fill={textEl.color}
          className="cursor-move select-none"
        >
          {textEl.content}
        </text>
      );
    }

    if (element.type === 'line') {
      const lineEl = element as LineElement;
      return (
        <line
          key={element.id}
          x1={lineEl.start.x}
          y1={lineEl.start.y}
          x2={lineEl.end.x}
          y2={lineEl.end.y}
          stroke={lineEl.color}
          strokeWidth={lineEl.strokeWidth}
          className="pointer-events-none"
        />
      );
    }

    if (element.type === 'arrow') {
      const arrowEl = element as ArrowElement;
      const angle = Math.atan2(arrowEl.end.y - arrowEl.start.y, arrowEl.end.x - arrowEl.start.x);
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;

      const arrowHead1 = {
        x: arrowEl.end.x - arrowLength * Math.cos(angle - arrowAngle),
        y: arrowEl.end.y - arrowLength * Math.sin(angle - arrowAngle),
      };

      const arrowHead2 = {
        x: arrowEl.end.x - arrowLength * Math.cos(angle + arrowAngle),
        y: arrowEl.end.y - arrowLength * Math.sin(angle + arrowAngle),
      };

      return (
        <g key={element.id} className="pointer-events-none">
          <line
            x1={arrowEl.start.x}
            y1={arrowEl.start.y}
            x2={arrowEl.end.x}
            y2={arrowEl.end.y}
            stroke={arrowEl.color}
            strokeWidth={arrowEl.strokeWidth}
          />
          <polygon
            points={`${arrowEl.end.x},${arrowEl.end.y} ${arrowHead1.x},${arrowHead1.y} ${arrowHead2.x},${arrowHead2.y}`}
            fill={arrowEl.color}
          />
        </g>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onClearCanvas={clearCanvas}
        zoom={state.viewBox.zoom}
      />

      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: activeTool === 'select' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair',
        }}
      >
        <defs>
          <pattern
            id="grid"
            width={20 * state.viewBox.zoom}
            height={20 * state.viewBox.zoom}
            patternUnits="userSpaceOnUse"
            x={(-state.viewBox.x * state.viewBox.zoom) % (20 * state.viewBox.zoom)}
            y={(-state.viewBox.y * state.viewBox.zoom) % (20 * state.viewBox.zoom)}
          >
            <path
              d={`M ${20 * state.viewBox.zoom} 0 L 0 0 0 ${20 * state.viewBox.zoom}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.5"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <g
          transform={`translate(${-state.viewBox.x * state.viewBox.zoom}, ${-state.viewBox.y * state.viewBox.zoom}) scale(${state.viewBox.zoom})`}
        >
          {state.elements.map(renderElement)}
          {currentElement && renderElement(currentElement)}
        </g>
      </svg>
    </div>
  );
};
