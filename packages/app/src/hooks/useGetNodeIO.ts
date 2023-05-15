import { useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { useStableCallback } from './useStableCallback';
import { ChartNode, NodeId, Nodes, createNodeInstance } from '@ironclad/nodai-core';
import { projectState } from '../state/savedGraphs';
import { keyBy } from 'lodash-es';

export function useGetNodeIO() {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);

  return useStableCallback((node: ChartNode) => {
    const tempImpl = createNodeInstance(node as Nodes);
    const nodeConnections =
      graph.connections?.filter((c) => c.inputNodeId === node.id || c.outputNodeId === node.id) ?? [];
    const nodesById = keyBy(graph.nodes, 'id') as Record<NodeId, ChartNode>;

    const inputDefinitions = tempImpl.getInputDefinitions(nodeConnections, nodesById, project);
    const outputDefinitions = tempImpl.getOutputDefinitions(nodeConnections, nodesById, project);

    return {
      inputDefinitions,
      outputDefinitions,
    };
  });
}
