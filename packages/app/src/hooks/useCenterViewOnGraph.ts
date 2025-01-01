import { type NodeGraph } from '@ironclad/rivet-core';
import { canvasPositionState, sidebarOpenState } from '../state/graphBuilder';
import { useSetAtom, useAtomValue } from 'jotai';
import { fitBoundsToViewport } from './useViewportBounds';

export function useCenterViewOnGraph() {
  const sidebarOpen = useAtomValue(sidebarOpenState);
  const setPosition = useSetAtom(canvasPositionState);

  return (graph: NodeGraph) => {
    if (graph.nodes.length === 0) {
      setPosition({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const minNodeX = Math.min(...graph.nodes.map((n) => n.visualData.x));
    const maxNodeX = Math.max(...graph.nodes.map((n) => n.visualData.x + (n.visualData.width ?? 300)));
    const minNodeY = Math.min(...graph.nodes.map((n) => n.visualData.y));
    const maxNodeY = Math.max(...graph.nodes.map((n) => n.visualData.y + 300));

    const bounds = {
      x: minNodeX - 100,
      y: minNodeY - 100,
      width: maxNodeX - minNodeX + 200,
      height: maxNodeY - minNodeY + 200,
    };

    const fittedCanvasPosition = fitBoundsToViewport(bounds, { sidebarOpen });
    setPosition(fittedCanvasPosition);
  };
}
