import { useRecoilValue } from 'recoil';
import { connectionsForNodeState, nodesByIdState } from '../state/graph';
import { useStableCallback } from './useStableCallback';
import { ChartNode, Nodes, createNodeInstance } from '@ironclad/rivet-core';
import { projectState } from '../state/savedGraphs';

export function useGetNodeIO() {
  const project = useRecoilValue(projectState);
  const nodesById = useRecoilValue(nodesByIdState);
  const connectionsForNode = useRecoilValue(connectionsForNodeState);

  return useStableCallback((node: ChartNode) => {
    const tempImpl = createNodeInstance(node as Nodes);

    const inputDefinitions = tempImpl.getInputDefinitions(connectionsForNode[node.id] ?? [], nodesById, project);
    const outputDefinitions = tempImpl.getOutputDefinitions(connectionsForNode[node.id] ?? [], nodesById, project);

    return {
      inputDefinitions,
      outputDefinitions,
    };
  });
}
