import { type NodeId } from '@ironclad/rivet-core';
import { useStableCallback } from './useStableCallback';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useLoadGraph } from './useLoadGraph';
import { projectState } from '../state/savedGraphs';
import { canvasPositionState } from '../state/graphBuilder';

export function useGoToNode() {
  const project = useRecoilValue(projectState);
  const loadGraph = useLoadGraph();
  const setPosition = useSetRecoilState(canvasPositionState);

  return useStableCallback((nodeId: NodeId) => {
    const graphForNode = Object.values(project.graphs).find((graph) => graph.nodes.some((n) => n.id === nodeId));

    if (graphForNode == null) {
      return;
    }

    const node = graphForNode.nodes.find((n) => n.id === nodeId)!;

    loadGraph(graphForNode);

    const nodeRect = { x: node.visualData.x, y: node.visualData.y, width: node.visualData.width ?? 300, height: 300 };
    const viewportBounds = { width: window.innerWidth, height: window.innerHeight };

    // Place node in the middle of the viewport at zoom 1
    const nodeCenter = { x: nodeRect.x + nodeRect.width / 2, y: nodeRect.y + nodeRect.height / 2 };
    const viewportCenter = {
      x: viewportBounds.width / 2,
      y: viewportBounds.height / 2,
    };
    const offset = { x: viewportCenter.x - nodeCenter.x, y: viewportCenter.y - nodeCenter.y };

    setPosition({ x: offset.x, y: offset.y, zoom: 1 });
  });
}
