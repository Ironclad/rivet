import { useLayoutEffect, useMemo, useState } from 'react';
import { useCanvasPositioning } from './useCanvasPositioning.js';
import { type CanvasPosition } from '../state/graphBuilder.js';

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function useViewportBounds(): ViewportBounds {
  const { clientToCanvasPosition } = useCanvasPositioning();

  const [{ innerWidth, innerHeight }, setWindowSize] = useState({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  });

  useLayoutEffect(() => {
    const onResize = () => {
      setWindowSize({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      });
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const bounds = useMemo(() => {
    const topLeft = clientToCanvasPosition(0, 0);
    const bottomRight = clientToCanvasPosition(innerWidth, innerHeight);

    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
    };
  }, [clientToCanvasPosition, innerWidth, innerHeight]);

  return bounds;
}

export function fitBoundsToViewport(
  nodeBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  options: { sidebarOpen?: boolean } = {},
): CanvasPosition {
  const viewportWidth = options.sidebarOpen ? window.innerWidth - 300 : window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate the required zoom level
  const zoomX = viewportWidth / nodeBounds.width;
  const zoomY = viewportHeight / nodeBounds.height;
  const zoom = Math.min(zoomX, zoomY);

  // Calculate the required position
  let x = -nodeBounds.x + (viewportWidth - nodeBounds.width * zoom) / (2 * zoom);
  const y = -nodeBounds.y + (viewportHeight - nodeBounds.height * zoom) / (2 * zoom);

  if (options.sidebarOpen) {
    x += 300 / zoom;
  }

  return { x, y, zoom };
}
