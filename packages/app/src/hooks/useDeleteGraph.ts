import { useSetAtom } from 'jotai';
import { type NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { useCallback } from 'react';

export function useDeleteGraph() {
  const setGraph = useSetAtom(graphState);
  const setSavedGraphs = useSetAtom(savedGraphsState);

  return useCallback(
    (savedGraph: NodeGraph) => {
      if (savedGraph.metadata?.id) {
        setSavedGraphs((prev) => prev.filter((g) => g.metadata?.id !== savedGraph.metadata?.id));
        setGraph(emptyNodeGraph());
      }
    },
    [setGraph, setSavedGraphs],
  );
}
