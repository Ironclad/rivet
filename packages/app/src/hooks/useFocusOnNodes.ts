import { type NodeId } from '@ironclad/rivet-core';
import { useStableCallback } from './useStableCallback';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder';
import { graphState } from '../state/graph';
import { fitBoundsToViewport } from './useViewportBounds';

export function useFocusOnNodes() {
  const setPosition = useSetRecoilState(canvasPositionState);
  const graph = useRecoilValue(graphState);

  return useStableCallback((nodeIds: NodeId[]) => {
    const node = graph.nodes.filter((n) => nodeIds.includes(n.id))!;

    const bounds = {
      left: Math.min(...node.map((n) => n.visualData.x)) - 300,
      right: Math.max(...node.map((n) => n.visualData.x + (n.visualData.width ?? 300))) + 300,
      top: Math.min(...node.map((n) => n.visualData.y)),
      bottom: Math.max(...node.map((n) => n.visualData.y + 300)),
    };

    const boundsXY = {
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    };

    const newBounds = fitBoundsToViewport(boundsXY);

    setPosition(newBounds);
  });
}
