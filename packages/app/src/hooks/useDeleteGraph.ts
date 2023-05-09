import { useSetRecoilState } from 'recoil';
import { NodeGraph, emptyNodeGraph } from '@ironclad/nodai-core';
import { graphState } from '../state/graph';
import { savedGraphsState } from '../state/savedGraphs';
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
