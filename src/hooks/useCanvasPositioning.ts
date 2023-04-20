import { useRecoilValue } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder';
import { useCallback } from 'react';

export function useCanvasPositioning() {
  const canvasPosition = useRecoilValue(canvasPositionState);

  const canvasToClientPosition = useCallback(
    (x: number, y: number) => {
      return { x: x + canvasPosition.x, y: y + canvasPosition.y };
    },
    [canvasPosition.x, canvasPosition.y],
  );

  const clientToCanvasPosition = useCallback(
    (x: number, y: number) => {
      return { x: x - canvasPosition.x, y: y - canvasPosition.y };
    },
    [canvasPosition.x, canvasPosition.y],
  );

  return {
    canvasPosition,
    canvasToClientPosition,
    clientToCanvasPosition,
  };
}
