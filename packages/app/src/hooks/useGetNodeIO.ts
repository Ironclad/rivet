import { useRecoilValue } from 'recoil';
import { connectionsSelector } from '../state/graph';
import { useStableCallback } from './useStableCallback';
import { Nodes, createNodeInstance } from '../model/Nodes';
import { ChartNode } from '../model/NodeBase';
import { projectState } from '../state/savedGraphs';

export function useGetNodeIO() {
  const connections = useRecoilValue(connectionsSelector);
  const project = useRecoilValue(projectState);

  return useStableCallback((node: ChartNode) => {
    const tempImpl = createNodeInstance(node as Nodes);
    const nodeConnections = connections?.filter((c) => c.inputNodeId === node.id || c.outputNodeId === node.id) ?? [];

    const inputDefinitions = tempImpl.getInputDefinitions(nodeConnections, project);
    const outputDefinitions = tempImpl.getOutputDefinitions(nodeConnections, project);

    return {
      inputDefinitions,
      outputDefinitions,
    };
  });
}
