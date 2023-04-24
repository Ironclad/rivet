import { useLatest } from 'ahooks';
import { MouseEvent, FC, useRef } from 'react';

interface ResizeHandleProps {
  onResizeStart?: (event: MouseEvent) => void;
  onResizeMove?: (event: MouseEvent) => void;
  onResizeEnd?: (event: MouseEvent) => void;
}

export const ResizeHandle: FC<ResizeHandleProps> = ({ onResizeStart, onResizeMove, onResizeEnd }) => {
  let onResizeMoveLatest = useLatest(onResizeMove);
  let onResizeStartLatest = useLatest(onResizeStart);
  let onResizeEndLatest = useLatest(onResizeEnd);

  let onResizeMoveRef = useRef<(event: MouseEvent) => void>(() => {});
  let handleMouseUpRef = useRef<(event: MouseEvent) => void>(() => {});

  const handleMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    onResizeStartLatest.current?.(event);

    onResizeMoveRef.current = (e) => onResizeMoveLatest.current?.(e);
    handleMouseUpRef.current = (e) => handleMouseUp(e);

    window.addEventListener('mousemove', onResizeMoveRef.current as any, {
      passive: true,
      capture: true,
    });
    window.addEventListener('mouseup', handleMouseUpRef.current as any, {
      capture: true,
    });
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
    onResizeEndLatest.current?.(event);
    window.removeEventListener('mousemove', onResizeMoveRef.current as any, {
      capture: true,
    });
    window.removeEventListener('mouseup', handleMouseUpRef.current as any, { capture: true });
  };

  return <div className="resize-handle" onMouseDown={handleMouseDown as any}></div>;
};
