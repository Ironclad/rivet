import { type NodeGraph } from '@ironclad/rivet-core';
import { useLoadGraph } from './useLoadGraph.js';
import { useStableCallback } from './useStableCallback.js';
import { useSetRecoilState } from 'recoil';
import { savedGraphsState } from '../state/savedGraphs.js';
import { duplicateGraph } from '../utils/duplicateGraph';

export function useDuplicateGraph() {
  const loadGraph = useLoadGraph();
  const setSavedGraphs = useSetRecoilState(savedGraphsState);

  return useStableCallback((savedGraph: NodeGraph) => {
    const duplicatedGraph = duplicateGraph(savedGraph);

    loadGraph(duplicatedGraph);

    setSavedGraphs((savedGraphs) => [...savedGraphs, duplicatedGraph]);
  });
}
