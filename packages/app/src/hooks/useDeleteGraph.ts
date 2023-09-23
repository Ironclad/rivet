import { useSetRecoilState } from 'recoil';
import { type NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';
import { useCallback } from 'react';

export function useDeleteGraph() {
  const setGraph = useSetRecoilState(graphState);
  const setSavedGraphs = useSetRecoilState(savedGraphsState);

  return useCallback(
    (savedGraph: NodeGraph) => {
      if (savedGraph.metadata?.id) {
        setSavedGraphs((savedGraphs) => {
          const newSavedGraphs = savedGraphs.filter((g) => g.metadata?.id !== savedGraph.metadata?.id);
          return newSavedGraphs;
        });
        setGraph(emptyNodeGraph());
      }
    },
    [setGraph, setSavedGraphs],
  );
}
