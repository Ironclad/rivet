import { useRef, useState, useCallback, useEffect } from 'react';

export const useContextMenu = () => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setShowContextMenu(true);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      // Close context menu if clicked outside of it
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [contextMenuRef]);

  return {
    contextMenuRef,
    showContextMenu,
    contextMenuPosition,
    handleContextMenu,
    setContextMenuPosition,
    setShowContextMenu,
  };
};
