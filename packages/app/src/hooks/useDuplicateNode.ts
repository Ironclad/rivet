import { globalRivetNodeRegistry, type NodeId } from '@ironclad/rivet-core';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { connectionsState, nodesByIdState, nodesState } from '../state/graph';

export function useDuplicateNode() {
  const nodesById = useAtomValue(nodesByIdState);
  const setNodes = useSetAtom(nodesState);
  const setConnections = useSetAtom(connectionsState);

  return (nodeId: NodeId) => {
    const node = nodesById[nodeId];

    if (!node) {
      return;
    }

    const newNode = globalRivetNodeRegistry.createDynamic(node.type);
    newNode.data = { ...(node.data as object) };
    newNode.visualData = {
      ...node.visualData,
      x: node.visualData.x,
      y: node.visualData.y + 200,
    };
    newNode.title = node.title;
    newNode.description = node.description;
    newNode.isSplitRun = node.isSplitRun;
    newNode.splitRunMax = node.splitRunMax;
    setNodes((prev) => [...prev, newNode]);

    setConnections((prev) => {
      const oldNodeConnections = prev.filter((c) => c.inputNodeId === nodeId);
      const newNodeConnections = oldNodeConnections.map((c) => ({
        ...c,
        inputNodeId: newNode.id,
      }));
      console.log('newNodeConnections', newNodeConnections);
      return [...prev, ...newNodeConnections];
    });
  };
}
