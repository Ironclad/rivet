import { useRecoilState, useRecoilValue } from 'recoil';
import { canvasPositionState, draggingWireState } from '../state/graphBuilder';
import { useViewportBounds } from './useViewportBounds';
import { useCanvasPositioning } from './useCanvasPositioning';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from 'ahooks';

export function useWireDragScrolling() {
  const draggingWire = useRecoilValue(draggingWireState);
  const viewport = useViewportBounds();
  const { clientToCanvasPosition } = useCanvasPositioning();
  const [canvasPosition, setCanvasPosition] = useRecoilState(canvasPositionState);
  const draggingWireLatest = useLatest(draggingWire);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingWireLatest.current) {
        return;
      }
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [draggingWireLatest]);
  const latestCanvasPosition = useLatest(canvasPosition);

  // If the mouse is within 10% of the edge of the viewport, then we'll start moving it

  const mousePositionViewport = useMemo(
    () => clientToCanvasPosition(mousePosition.x, mousePosition.y),
    [mousePosition, clientToCanvasPosition],
  );

  const viewportWidth = viewport.right - viewport.left;
  const viewportHeight = viewport.bottom - viewport.top;

  const isMouseNearLeftEdge = mousePositionViewport.x < viewport.left + viewportWidth * 0.1;
  const isMouseNearRightEdge = mousePositionViewport.x > viewport.left + viewportWidth * 0.9;
  const isMouseNearTopEdge = mousePositionViewport.y < viewport.top + viewportHeight * 0.1;
  const isMouseNearBottomEdge = mousePositionViewport.y > viewport.top + viewportHeight * 0.9;

  const isMouseNearEdge = isMouseNearLeftEdge || isMouseNearRightEdge || isMouseNearTopEdge || isMouseNearBottomEdge;

  const nearLatest = useLatest({
    isMouseNearEdge,
    isMouseNearLeftEdge,
    isMouseNearRightEdge,
    isMouseNearTopEdge,
    isMouseNearBottomEdge,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>();

  useEffect(() => {
    if (!isMouseNearEdge || draggingWire == null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    if (intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!draggingWire) {
        return;
      }

      const dx = nearLatest.current.isMouseNearLeftEdge ? 1 : nearLatest.current.isMouseNearRightEdge ? -1 : 0;
      const dy = nearLatest.current.isMouseNearTopEdge ? 1 : nearLatest.current.isMouseNearBottomEdge ? -1 : 0;

      setCanvasPosition((pos) => ({
        ...pos,
        x: pos.x + (dx * 10) / latestCanvasPosition.current.zoom,
        y: pos.y + (dy * 10) / latestCanvasPosition.current.zoom,
      }));
    }, 25);
  }, [
    isMouseNearEdge,
    draggingWire,
    isMouseNearLeftEdge,
    isMouseNearBottomEdge,
    isMouseNearRightEdge,
    isMouseNearTopEdge,
    nearLatest,
    setCanvasPosition,
    latestCanvasPosition,
  ]);
}
