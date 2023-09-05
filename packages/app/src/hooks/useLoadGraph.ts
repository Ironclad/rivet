import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { useSaveCurrentGraph } from './useSaveCurrentGraph.js';
import {
  canvasPositionState,
  graphNavigationStackState,
  lastCanvasPositionByGraphState,
  selectedNodesState,
  sidebarOpenState,
} from '../state/graphBuilder.js';
import { useStableCallback } from './useStableCallback.js';
import { fitBoundsToViewport } from './useViewportBounds.js';

export function useLoadGraph() {
  const [graph, setGraph] = useRecoilState(graphState);

  const setPosition = useSetRecoilState(canvasPositionState);
  const saveCurrentGraph = useSaveCurrentGraph();
  const sidebarOpen = useRecoilValue(sidebarOpenState);
  const lastSavedPositions = useRecoilValue(lastCanvasPositionByGraphState);
  const setGraphNavigationStack = useSetRecoilState(graphNavigationStackState);
  const setSelectedNodes = useSetRecoilState(selectedNodesState);

  return useStableCallback((savedGraph: NodeGraph, { pushHistory = true }: { pushHistory?: boolean } = {}) => {
    if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
      saveCurrentGraph();
    }

    setGraph(savedGraph);
    setSelectedNodes([]);

    if (pushHistory) {
      setGraphNavigationStack((state) => ({
        index: (state.index ?? -1) + 1,
        stack: [...state.stack.slice(0, (state.index ?? -1) + 1), savedGraph.metadata!.id!],
      }));
    }

    const lastSavedPosition = lastSavedPositions[savedGraph.metadata!.id!];
    if (lastSavedPosition && graph.metadata!.id! !== savedGraph.metadata!.id!) {
      setPosition(lastSavedPosition);
    } else if (savedGraph.nodes.length > 0) {
      const minNodeX = Math.min(...savedGraph.nodes.map((n) => n.visualData.x));
      const maxNodeX = Math.max(...savedGraph.nodes.map((n) => n.visualData.x + (n.visualData.width ?? 300)));
      const minNodeY = Math.min(...savedGraph.nodes.map((n) => n.visualData.y));
      const maxNodeY = Math.max(...savedGraph.nodes.map((n) => n.visualData.y + 300));

      const bounds = {
        x: minNodeX - 100,
        y: minNodeY - 100,
        width: maxNodeX - minNodeX + 200,
        height: maxNodeY - minNodeY + 200,
      };

      const fittedCanvasPosition = fitBoundsToViewport(bounds, { sidebarOpen });
      setPosition(fittedCanvasPosition);
    } else {
      setPosition({ x: 0, y: 0, zoom: 1 });
    }
  });
}
