import { useAtomValue } from 'jotai';
import { canvasPositionState } from '../state/graphBuilder.js';
import { useCallback } from 'react';

export const canvasToClientPosition =
  (canvasPosition: { x: number; y: number; zoom: number }) => (x: number, y: number) => {
    const clientX = (x + canvasPosition.x) * canvasPosition.zoom;
    const clientY = (y + canvasPosition.y) * canvasPosition.zoom;
    return { x: clientX, y: clientY };
  };

export const clientToCanvasPosition =
  (canvasPosition: { x: number; y: number; zoom: number }) => (x: number, y: number) => {
    const canvasX = x / canvasPosition.zoom - canvasPosition.x;
    const canvasY = y / canvasPosition.zoom - canvasPosition.y;
    return { x: canvasX, y: canvasY };
  };

export function useCanvasPositioning() {
  const canvasPosition = useAtomValue(canvasPositionState);

  const canvasToClientPositionLocal = useCallback(
    (x: number, y: number) => canvasToClientPosition(canvasPosition)(x, y),
    [canvasPosition],
  );

  const clientToCanvasPositionLocal = useCallback(
    (x: number, y: number) => clientToCanvasPosition(canvasPosition)(x, y),
    [canvasPosition],
  );

  return {
    canvasPosition,
    canvasToClientPosition: canvasToClientPositionLocal,
    clientToCanvasPosition: clientToCanvasPositionLocal,
  };
}
