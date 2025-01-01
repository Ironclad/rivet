import { type ChartNode, type NodeId } from '@ironclad/rivet-core';
import { useStableCallback } from './useStableCallback';
import { useAtom } from 'jotai';
import { connectionsState, nodesState } from '../state/graph';

export const useRemoveNodes = () => {
  const [nodes, setNodes] = useAtom(nodesState);
  const [connections, setConnections] = useAtom(connectionsState);

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  return useStableCallback((...nodeIds: NodeId[]) => {
    const newNodes = [...nodes];
    let newConnections = [...connections];
    for (const nodeId of nodeIds) {
      const nodeIndex = newNodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex >= 0) {
        newNodes.splice(nodeIndex, 1);
      }

      // Remove all connections associated with the node
      newConnections = newConnections.filter((c) => c.inputNodeId !== nodeId && c.outputNodeId !== nodeId);
    }
    nodesChanged?.(newNodes);
    setConnections?.(newConnections);
  });
};
