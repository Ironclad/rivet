import { useSetAtom, useAtom } from 'jotai';
import { type NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { useCallback } from 'react';

export function useDeleteGraph() {
  const setGraph = useSetAtom(graphState);
  const [savedGraphs, setSavedGraphs] = useAtom(savedGraphsState);

  return useCallback(
    (savedGraph: NodeGraph) => {
      if (savedGraph.metadata?.id) {
        setSavedGraphs(savedGraphs.filter((g) => g.metadata?.id !== savedGraph.metadata?.id));
        setGraph(emptyNodeGraph());
      }
    },
    [setGraph, setSavedGraphs, savedGraphs],
  );
}
