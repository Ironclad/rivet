import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  type CanvasPosition,
  canvasPositionState,
  searchingGraphState,
  editingNodeState,
  hoveringNodeState,
} from '../state/graphBuilder';
import { useLatest } from 'ahooks';
import { useViewportBounds } from './useViewportBounds';
import { useCanvasPositioning } from './useCanvasPositioning';

export function useCanvasHotkeys() {
  const [canvasPosition, setCanvasPosition] = useRecoilState(canvasPositionState);
  const viewportBounds = useViewportBounds();
  const { canvasToClientPosition } = useCanvasPositioning();
  const setSearching = useSetRecoilState(searchingGraphState);
  const setEditingNode = useSetRecoilState(editingNodeState);
  const hoveringNode = useRecoilValue(hoveringNodeState);

  const latestHandler = useLatest((e: KeyboardEvent) => {
    // If we're in an input, don't do anything
    if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase()!)) {
      return;
    }

    if ((e.key === '-' || e.key === '=') && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      const zoomSpeed = 0.25;
      const zoomFactor = e.key === '=' ? 1 + zoomSpeed : 1 - zoomSpeed;

      const newZoom = canvasPosition.zoom * zoomFactor;

      const centerOfScreenCanvasCoords = {
        x: viewportBounds.left + (viewportBounds.right - viewportBounds.left) / 2,
        y: viewportBounds.top + (viewportBounds.bottom - viewportBounds.top) / 2,
      };

      const { x: clientX, y: clientY } = canvasToClientPosition(
        centerOfScreenCanvasCoords.x,
        centerOfScreenCanvasCoords.y,
      );

      const newX = clientX / newZoom - canvasPosition.x;
      const newY = clientY / newZoom - canvasPosition.y;

      const diff = {
        x: newX - centerOfScreenCanvasCoords.x,
        y: newY - centerOfScreenCanvasCoords.y,
      };

      const position: CanvasPosition = {
        x: canvasPosition.x + diff.x,
        y: canvasPosition.y + diff.y,
        zoom: newZoom,
      };

      setCanvasPosition(position);
    }

    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
    if (isArrowKey) {
      const arrowSpeed = 100;
      const arrowFactor = e.shiftKey ? 10 : 1;
      const arrowDirection = {
        ArrowUp: { x: 0, y: 1 },
        ArrowDown: { x: 0, y: -1 },
        ArrowLeft: { x: 1, y: 0 },
        ArrowRight: { x: -1, y: 0 },
      };

      const direction = arrowDirection[e.key as keyof typeof arrowDirection];
      const diff = {
        x: direction.x * arrowSpeed * arrowFactor,
        y: direction.y * arrowSpeed * arrowFactor,
      };

      const position: CanvasPosition = {
        x: canvasPosition.x + diff.x,
        y: canvasPosition.y + diff.y,
        zoom: canvasPosition.zoom,
      };
      setCanvasPosition(position);
    }

    if (e.key === 'f' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      setSearching({ searching: true, query: '' });
    }

    if (e.key === 'e' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName!)) {
        return;
      }

      if (hoveringNode) {
        setEditingNode(hoveringNode);
      }
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
  }, [latestHandler]);
}
