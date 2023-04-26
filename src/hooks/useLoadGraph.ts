import { useRecoilState, useSetRecoilState } from 'recoil';
import { NodeGraph, emptyNodeGraph } from '../model/NodeGraph';
import { useStableCallback } from './useStableCallback';
import { graphState } from '../state/graph';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { canvasPositionState } from '../state/graphBuilder';
import { useCallback } from 'react';

export function useLoadGraph() {
  const [graph, setGraph] = useRecoilState(graphState);
  const setPosition = useSetRecoilState(canvasPositionState);
  const saveCurrentGraph = useSaveCurrentGraph();

  return useCallback(
    (savedGraph: NodeGraph) => {
      if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
        saveCurrentGraph();
      }

      setPosition({ x: 0, y: 0, zoom: 1 });

      setGraph(savedGraph);
    },
    [graph, saveCurrentGraph, setGraph, setPosition],
  );
}
