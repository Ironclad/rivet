import { useAtomValue, useSetAtom } from 'jotai';
import { connectionsState, nodesState } from '../state/graph';
import { useCommand } from './Command';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder';
import { type NodeConnection, type ChartNode, type NodeId } from '@ironclad/rivet-core';
import { partition } from 'lodash-es';

export const useDeleteNodesCommand = () => {
  const selectedNodeIds = useAtomValue(selectedNodesState);

  const setNodes = useSetAtom(nodesState);
  const setConnections = useSetAtom(connectionsState);
  const setSelectedNodeIds = useSetAtom(selectedNodesState);
  const setEditingNodeId = useSetAtom(editingNodeState);

  return useCommand<{ nodeIds: NodeId[] }, { removedNodes: ChartNode[]; removedConnections: NodeConnection[] }>({
    type: 'deleteNode',
    apply(args, _appliedData, currentState) {
      const nodeIds =
        selectedNodeIds.length > 0 ? [...new Set([...selectedNodeIds, ...args.nodeIds])] : [...args.nodeIds];

      const newNodes = [...currentState.nodes];
      let newConnections = [...currentState.connections];

      const removedNodes: ChartNode[] = [];
      const removedConnections: NodeConnection[] = [];

      for (const nodeId of nodeIds) {
        const nodeIndex = newNodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex >= 0) {
          const [removedNode] = newNodes.splice(nodeIndex, 1);
          removedNodes.push(removedNode!);
        }

        // Remove all connections associated with the node
        const [removeConnections, keepConnections] = partition(
          newConnections,
          (c) => c.inputNodeId === nodeId || c.outputNodeId === nodeId,
        );
        newConnections = keepConnections;
        removedConnections.push(...removeConnections);
      }

      if (currentState.editingNodeId && nodeIds.includes(currentState.editingNodeId)) {
        setEditingNodeId(null);
      }

      setNodes?.(newNodes);
      setConnections?.(newConnections);
      setSelectedNodeIds((current) => current.filter((id) => !nodeIds.includes(id)));

      return {
        removedNodes,
        removedConnections,
      };
    },
    undo(_data, { removedNodes, removedConnections }, currentState) {
      const newNodes = [...currentState.nodes, ...removedNodes];
      const newConnections = [...currentState.connections, ...removedConnections];

      setNodes(newNodes);
      setConnections(newConnections);
    },
  });
};
