import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { type CanvasPosition, canvasPositionState } from '../state/graphBuilder';
import { useLatest } from 'ahooks';
import { useViewportBounds } from './useViewportBounds';
import { useCanvasPositioning } from './useCanvasPositioning';

export function useCanvasHotkeys() {
  const [canvasPosition, setCanvasPosition] = useRecoilState(canvasPositionState);
  const viewportBounds = useViewportBounds();
  const { clientToCanvasPosition } = useCanvasPositioning();

  const latestHandler = useLatest((e: KeyboardEvent) => {
    if ((e.key === '-' || e.key === '=') && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      const zoomSpeed = 0.25;
      const zoomFactor = e.key === '=' ? 1 + zoomSpeed : 1 - zoomSpeed;

      const newZoom = canvasPosition.zoom * zoomFactor;

      const viewportCenter = {
        x: viewportBounds.left + (viewportBounds.right - viewportBounds.left) / 2,
        y: viewportBounds.top + (viewportBounds.bottom - viewportBounds.top) / 2,
      };

      const currentMousePosCanvas = clientToCanvasPosition(viewportCenter.x, viewportCenter.y);
      const newX = viewportCenter.x / newZoom - canvasPosition.x;
      const newY = viewportCenter.y / newZoom - canvasPosition.y;

      const diff = {
        x: newX - currentMousePosCanvas.x,
        y: newY - currentMousePosCanvas.y,
      };

      const position: CanvasPosition = {
        x: canvasPosition.x + diff.x,
        y: canvasPosition.y + diff.y,
        zoom: newZoom,
      };
      setCanvasPosition(position);
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      latestHandler.current(e);
    };

    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);
}
