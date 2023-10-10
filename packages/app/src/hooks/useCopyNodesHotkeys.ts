import { useRecoilValue } from 'recoil';
import { editingNodeState, lastMousePositionState, selectedNodesState } from '../state/graphBuilder';
import { useLatest } from 'ahooks';
import { useEffect } from 'react';
import { useCopyNodes } from './useCopyNodes';
import { usePasteNodes } from './usePasteNodes';

export function useCopyNodesHotkeys() {
  const selectedNodeIds = useRecoilValue(selectedNodesState);
  const editingNodeId = useRecoilValue(editingNodeState);

  const latestSelectedNodeIds = useLatest(selectedNodeIds);
  const latestEditingNodeId = useLatest(editingNodeId);

  const mousePosition = useRecoilValue(lastMousePositionState);
  const latestMousePosition = useLatest(mousePosition);

  const copyNodes = useCopyNodes();
  const pasteNodes = usePasteNodes();

  const latestCopyNodes = useLatest(copyNodes);
  const latestPasteNodes = useLatest(pasteNodes);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const isCopy = e.key === 'c' && (e.metaKey || e.ctrlKey) && !e.shiftKey;
      if (isCopy && latestSelectedNodeIds.current.length > 0 && !latestEditingNodeId.current) {
        e.preventDefault();
        e.stopPropagation();

        latestCopyNodes.current();
      }

      const isPaste = e.key === 'v' && (e.metaKey || e.ctrlKey) && !e.shiftKey;
      if (isPaste && !latestEditingNodeId.current) {
        e.preventDefault();
        e.stopPropagation();

        latestPasteNodes.current({ x: latestMousePosition.current.x, y: latestMousePosition.current.y });
      }
    };
    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);
}
