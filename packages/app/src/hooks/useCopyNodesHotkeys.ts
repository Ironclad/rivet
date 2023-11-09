import { useRecoilValue } from 'recoil';
import { editingNodeState, lastMousePositionState, selectedNodesState } from '../state/graphBuilder';
import { useLatest } from 'ahooks';
import { useEffect } from 'react';
import { useCopyNodes } from './useCopyNodes';
import { usePasteNodes } from './usePasteNodes';
import { useDuplicateNode } from './useDuplicateNode';

export function useCopyNodesHotkeys() {
  const selectedNodeIds = useRecoilValue(selectedNodesState);
  const editingNodeId = useRecoilValue(editingNodeState);

  const mousePosition = useRecoilValue(lastMousePositionState);

  const copyNodes = useCopyNodes();
  const pasteNodes = usePasteNodes();
  const duplicateNode = useDuplicateNode();

  const latestListener = useLatest((e: KeyboardEvent) => {
    if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase()!)) {
      return;
    }

    const isCopy = e.key === 'c' && (e.metaKey || e.ctrlKey) && !e.shiftKey;
    if (isCopy && selectedNodeIds.length > 0 && !editingNodeId) {
      e.preventDefault();
      e.stopPropagation();

      copyNodes();
    }

    const isPaste = e.key === 'v' && (e.metaKey || e.ctrlKey) && !e.shiftKey;
    if (isPaste && !editingNodeId) {
      e.preventDefault();
      e.stopPropagation();

      pasteNodes({ x: mousePosition.x, y: mousePosition.y });
    }

    const isDuplicate = e.key === 'd' && (e.metaKey || e.ctrlKey) && !e.shiftKey;
    if (isDuplicate && selectedNodeIds.length === 1 && !editingNodeId) {
      e.preventDefault();
      e.stopPropagation();

      const nodeId = selectedNodeIds[0]!;
      duplicateNode(nodeId);
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      latestListener.current(e);
    };
    window.addEventListener('keydown', listener);

    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [latestListener]);
}
