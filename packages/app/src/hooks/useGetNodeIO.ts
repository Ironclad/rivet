import { useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { useStableCallback } from './useStableCallback';
import { ChartNode, NodeId, Nodes, createNodeInstance } from '@ironclad/rivet-core';
import { projectState } from '../state/savedGraphs';
import { keyBy } from 'lodash-es';
import { useMemo } from 'react';

export function useGetNodeIO() {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const connections = graph.connections;

  const connectionsByNode = useMemo(() => {
    return connections.reduce((acc, connection) => {
      acc[connection.inputNodeId] = acc[connection.inputNodeId] ?? [];
      acc[connection.inputNodeId]!.push(connection);
      acc[connection.outputNodeId] = acc[connection.outputNodeId] ?? [];
      acc[connection.outputNodeId]!.push(connection);
      return acc;
    }, {} as Record<NodeId, typeof connections>);
  }, [connections]);

  return useStableCallback((node: ChartNode) => {
    const tempImpl = createNodeInstance(node as Nodes);
    const nodeConnections = connectionsByNode[node.id] ?? [];
    const nodesById = keyBy(graph.nodes, 'id') as Record<NodeId, ChartNode>;

    const inputDefinitions = tempImpl.getInputDefinitions(nodeConnections, nodesById, project);
    const outputDefinitions = tempImpl.getOutputDefinitions(nodeConnections, nodesById, project);

    return {
      inputDefinitions,
      outputDefinitions,
    };
  });
}
