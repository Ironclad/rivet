import { useFloating, autoUpdate, shift, useMergeRefs } from '@floating-ui/react';
import { useRef, useState, useCallback, useEffect } from 'react';

export type ContextMenuData = {
  x: number;
  y: number;
  data: {
    type: string;
    element: HTMLElement;
  } | null;
};
export const useContextMenu = () => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuData, setContextMenuData] = useState<ContextMenuData>({ x: -3000, y: 0, data: null });

  const handleContextMenu = useCallback(
    (event: Pick<React.MouseEvent<HTMLDivElement>, 'clientX' | 'clientY' | 'target'>) => {
      const data = getContextMenuDataFromTarget(event.target as HTMLElement);

      setShowContextMenu(true);

      setContextMenuData({ x: event.clientX, y: event.clientY, data });
    },
    [],
  );

  const { refs, floatingStyles, update } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [shift({ crossAxis: true })],
  });

  useEffect(() => {
    update();
  }, [update, contextMenuData.x, contextMenuData.y]);

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      // Close context menu if clicked outside of it
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    const handleEscapePress = (event: KeyboardEvent) => {
      // Close context menu if escape key is pressed
      if (event.key === 'Escape') {
        setShowContextMenu(false);
      }
    };

    window.addEventListener('click', handleWindowClick);
    window.addEventListener('keydown', handleEscapePress);
    return () => {
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('keydown', handleEscapePress);
    };
  }, [contextMenuRef]);

  refs.setReference = useMergeRefs([refs.setReference, contextMenuRef]) as any;

  return {
    contextMenuRef,
    showContextMenu,
    contextMenuData,
    handleContextMenu,
    setContextMenuData,
    setShowContextMenu,
    refs,
    floatingStyles,
    update,
  };
};

const getContextMenuDataFromTarget = (target: HTMLElement | null): ContextMenuData['data'] | null => {
  while (target && !target.dataset.contextmenutype) {
    target = target.parentElement;
  }
  return target ? { type: target.dataset.contextmenutype!, element: target } : null;
};
