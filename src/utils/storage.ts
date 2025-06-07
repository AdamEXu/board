import { WhiteboardState } from '@/types/whiteboard';

const STORAGE_KEY = 'whiteboard-state';

export const saveWhiteboardState = (state: WhiteboardState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Failed to save whiteboard state:', error);
  }
};

export const loadWhiteboardState = (): WhiteboardState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Failed to load whiteboard state:', error);
    return null;
  }
};

export const clearWhiteboardState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear whiteboard state:', error);
  }
};

export const getDefaultWhiteboardState = (): WhiteboardState => ({
  elements: [],
  viewBox: {
    x: 0,
    y: 0,
    zoom: 1,
  },
});
