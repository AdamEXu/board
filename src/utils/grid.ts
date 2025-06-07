import { Point } from '@/types/whiteboard';

export const GRID_SIZE = 20;

/**
 * Snaps a point to the nearest grid intersection
 */
export const snapToGrid = (point: Point, gridSize: number = GRID_SIZE): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

/**
 * Checks if a point is close enough to a grid line to snap
 */
export const shouldSnapToGrid = (point: Point, gridSize: number = GRID_SIZE, threshold: number = 10): boolean => {
  const snapped = snapToGrid(point, gridSize);
  const distance = Math.sqrt(
    Math.pow(point.x - snapped.x, 2) + Math.pow(point.y - snapped.y, 2)
  );
  return distance <= threshold;
};

/**
 * Gets the nearest grid point for visual feedback
 */
export const getNearestGridPoint = (point: Point, gridSize: number = GRID_SIZE): Point => {
  return snapToGrid(point, gridSize);
};
