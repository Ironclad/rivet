import { type NodeGraph } from '@ironclad/rivet-core';
import { canvasPositionState, sidebarOpenState } from '../state/graphBuilder';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { fitBoundsToViewport } from './useViewportBounds';

export function useCenterViewOnGraph() {
  const sidebarOpen = useRecoilValue(sidebarOpenState);
  const setPosition = useSetRecoilState(canvasPositionState);

  return (graph: NodeGraph) => {
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
