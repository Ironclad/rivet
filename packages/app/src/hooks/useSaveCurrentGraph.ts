import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { GraphId } from '@ironclad/rivet-core';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { graphState } from '../state/graph';
import { savedGraphsState } from '../state/savedGraphs';

export function useSaveCurrentGraph() {
  const [graphData, setGraphData] = useRecoilState(graphState);
  const setSavedGraphs = useSetRecoilState(savedGraphsState);

  return () => {
    let currentGraph = produce(graphData, (draft) => {
      if (!draft.metadata) {
        draft.metadata = {
          id: nanoid() as GraphId,
          name: 'Untitled',
          description: '',
        };
      } else if (!draft.metadata.id) {
        draft.metadata.id = nanoid() as GraphId;
      }

      return draft;
    });

    setGraphData(currentGraph);

    setSavedGraphs((savedGraphs) => {
      let existingGraph = savedGraphs.find((g) => g.metadata?.id === currentGraph.metadata?.id);
      if (existingGraph) {
        return savedGraphs.map((g) => (g.metadata?.id === currentGraph.metadata?.id ? currentGraph : g));
      } else {
        return [...savedGraphs, currentGraph];
      }
    });

    return currentGraph;
  };
}
