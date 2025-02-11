import { produce } from 'immer';
import { nanoid } from 'nanoid/non-secure';
import { type GraphId } from '@ironclad/rivet-core';
import { useAtom } from 'jotai';
import { graphState } from '../state/graph.js';
import { savedGraphsState } from '../state/savedGraphs.js';

export function useSaveCurrentGraph() {
  const [graphData, setGraphData] = useAtom(graphState);
  const [savedGraphs, setSavedGraphs] = useAtom(savedGraphsState);

  return () => {
    if (graphData.nodes.length === 0 && graphData.connections.length === 0) {
      return;
    }

    const currentGraph = produce(graphData, (draft) => {
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

    const existingGraph = savedGraphs.find((g) => g.metadata?.id === currentGraph.metadata?.id);
    if (existingGraph) {
      setSavedGraphs(savedGraphs.map((g) => (g.metadata?.id === currentGraph.metadata?.id ? currentGraph : g)));
    } else {
      setSavedGraphs([...savedGraphs, currentGraph]);
    }

    return currentGraph;
  };
}
