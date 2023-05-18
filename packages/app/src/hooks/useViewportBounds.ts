import { useMemo } from 'react';
import { useCanvasPositioning } from './useCanvasPositioning';

interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function useViewportBounds(): ViewportBounds {
  const { clientToCanvasPosition } = useCanvasPositioning();

  const bounds = useMemo(() => {
    const topLeft = clientToCanvasPosition(0, 0);
    const bottomRight = clientToCanvasPosition(window.innerWidth, window.innerHeight);

    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
    };
  }, [clientToCanvasPosition]);

  return bounds;
}
