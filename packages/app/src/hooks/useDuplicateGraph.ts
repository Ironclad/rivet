import { GraphId, NodeGraph, NodeId } from '@ironclad/rivet-core';
import { nanoid } from 'nanoid';
import { useLoadGraph } from './useLoadGraph.js';
import { useStableCallback } from './useStableCallback.js';
import { useSetRecoilState } from 'recoil';
import { savedGraphsState } from '../state/savedGraphs.js';
import { produce } from 'immer';

export function useDuplicateGraph() {
  const loadGraph = useLoadGraph();
  const setSavedGraphs = useSetRecoilState(savedGraphsState);

  return useStableCallback((savedGraph: NodeGraph) => {
    let duplicatedGraph: NodeGraph = produce(savedGraph, (draft) => ({
      ...draft,
      metadata: {
        ...draft.metadata,
        id: nanoid() as GraphId,
        name: `${draft.metadata?.name} (Copy)`,
      },
    }));

    duplicatedGraph = produce(duplicatedGraph, (draft) => {
      // Generate new IDs for all nodes and update connections
      for (const node of draft.nodes) {
        const oldId = node.id;
        node.id = nanoid() as NodeId;

        for (const connection of draft.connections) {
          if (connection.inputNodeId === oldId) {
            connection.inputNodeId = node.id;
          }
          if (connection.outputNodeId === oldId) {
            connection.outputNodeId = node.id;
          }
        }
      }
    });

    loadGraph(duplicatedGraph);

    setSavedGraphs((savedGraphs) => [...savedGraphs, duplicatedGraph]);
  });
}
