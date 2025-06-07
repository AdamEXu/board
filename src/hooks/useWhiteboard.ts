'use client';

import { useState, useEffect, useCallback } from 'react';
import { WhiteboardState, WhiteboardElement, Tool, Point } from '@/types/whiteboard';
import { saveWhiteboardState, loadWhiteboardState, getDefaultWhiteboardState } from '@/utils/storage';

export const useWhiteboard = () => {
  const [state, setState] = useState<WhiteboardState>(getDefaultWhiteboardState());
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<WhiteboardElement | null>(null);

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
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, element],
    }));
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<WhiteboardElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const removeElement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
  }, []);

  const clearCanvas = useCallback(() => {
    setState(prev => ({
      ...prev,
      elements: [],
    }));
  }, []);

  const updateViewBox = useCallback((updates: Partial<WhiteboardState['viewBox']>) => {
    setState(prev => ({
      ...prev,
      viewBox: { ...prev.viewBox, ...updates },
    }));
  }, []);

  const zoomIn = useCallback(() => {
    updateViewBox({ zoom: Math.min(state.viewBox.zoom * 1.2, 5) });
  }, [state.viewBox.zoom, updateViewBox]);

  const zoomOut = useCallback(() => {
    updateViewBox({ zoom: Math.max(state.viewBox.zoom / 1.2, 0.1) });
  }, [state.viewBox.zoom, updateViewBox]);

  const resetView = useCallback(() => {
    updateViewBox({ x: 0, y: 0, zoom: 1 });
  }, [updateViewBox]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    updateViewBox({
      x: state.viewBox.x - deltaX / state.viewBox.zoom,
      y: state.viewBox.y - deltaY / state.viewBox.zoom,
    });
  }, [state.viewBox, updateViewBox]);

  const screenToCanvas = useCallback((screenPoint: Point): Point => {
    return {
      x: (screenPoint.x / state.viewBox.zoom) + state.viewBox.x,
      y: (screenPoint.y / state.viewBox.zoom) + state.viewBox.y,
    };
  }, [state.viewBox]);

  const canvasToScreen = useCallback((canvasPoint: Point): Point => {
    return {
      x: (canvasPoint.x - state.viewBox.x) * state.viewBox.zoom,
      y: (canvasPoint.y - state.viewBox.y) * state.viewBox.zoom,
    };
  }, [state.viewBox]);

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
  };
};
