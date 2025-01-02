import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { type NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState, historicalGraphState, isReadOnlyGraphState } from '../state/graph.js';
import { useSaveCurrentGraph } from './useSaveCurrentGraph.js';
import {
  canvasPositionState,
  graphNavigationStackState,
  lastCanvasPositionByGraphState,
  selectedNodesState,
  sidebarOpenState,
} from '../state/graphBuilder.js';
import { useStableCallback } from './useStableCallback.js';
import { useCenterViewOnGraph } from './useCenterViewOnGraph';

export function useLoadGraph() {
  const [graph, setGraph] = useAtom(graphState);

  const setPosition = useSetAtom(canvasPositionState);
  const saveCurrentGraph = useSaveCurrentGraph();
  const lastSavedPositions = useAtomValue(lastCanvasPositionByGraphState);
  const setGraphNavigationStack = useSetAtom(graphNavigationStackState);
  const setSelectedNodes = useSetAtom(selectedNodesState);
  const centerViewOnGraph = useCenterViewOnGraph();
  const setHistoricalGraph = useSetAtom(historicalGraphState);
  const setIsReadOnlyGraph = useSetAtom(isReadOnlyGraphState);

  return useStableCallback((savedGraph: NodeGraph, { pushHistory = true }: { pushHistory?: boolean } = {}) => {
    if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
      saveCurrentGraph();
    }

    setGraph(savedGraph);
    setSelectedNodes([]);
    setIsReadOnlyGraph(false);
    setHistoricalGraph(null);

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
      centerViewOnGraph(savedGraph);
    } else {
      setPosition({ x: 0, y: 0, zoom: 1 });
    }
  });
}
