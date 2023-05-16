import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphId, NodeGraph, emptyNodeGraph } from '@ironclad/nodai-core';
import { graphState } from '../state/graph';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { canvasPositionState, lastCanvasPositionForGraphState } from '../state/graphBuilder';
import { nanoid } from 'nanoid';
import { useStableCallback } from './useStableCallback';
import { useEffect } from 'react';

export function useLoadGraph() {
  const [graph, setGraph] = useRecoilState(graphState);

  const lastSavedCanvasPosition = useRecoilValue(
    lastCanvasPositionForGraphState(graph?.metadata?.id ?? (nanoid() as GraphId)),
  );

  const [position, setPosition] = useRecoilState(canvasPositionState);
  const saveCurrentGraph = useSaveCurrentGraph();

  // Hacky... maybe last info shouldn't be in recoil because of this
  useEffect(() => {
    if (lastSavedCanvasPosition && position.x === 0 && position.y === 0 && position.zoom === 1 && !position.fromSaved) {
      setPosition({ ...lastSavedCanvasPosition, fromSaved: true });
    }
  }, [graph, lastSavedCanvasPosition, position, setPosition]);

  return useStableCallback((savedGraph: NodeGraph) => {
    if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
      saveCurrentGraph();
    }

    setPosition(lastSavedCanvasPosition ?? { x: 0, y: 0, zoom: 1 });

    setGraph(savedGraph);
  });
}
