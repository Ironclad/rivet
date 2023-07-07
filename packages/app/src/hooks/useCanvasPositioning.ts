import { useRecoilValue } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder.js';
import { useCallback } from 'react';

export function useCanvasPositioning() {
  const canvasPosition = useRecoilValue(canvasPositionState);

  const canvasToClientPosition = useCallback(
    (x: number, y: number) => {
      const clientX = (x + canvasPosition.x) * canvasPosition.zoom;
      const clientY = (y + canvasPosition.y) * canvasPosition.zoom;
      return { x: clientX, y: clientY };
    },
    [canvasPosition.x, canvasPosition.y, canvasPosition.zoom],
  );

  const clientToCanvasPosition = useCallback(
    (x: number, y: number) => {
      const canvasX = x / canvasPosition.zoom - canvasPosition.x;
      const canvasY = y / canvasPosition.zoom - canvasPosition.y;
      return { x: canvasX, y: canvasY };
    },
    [canvasPosition.x, canvasPosition.y, canvasPosition.zoom],
  );

  return {
    canvasPosition,
    canvasToClientPosition,
    clientToCanvasPosition,
  };
}
