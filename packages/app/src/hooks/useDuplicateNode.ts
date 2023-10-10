import { globalRivetNodeRegistry, type NodeId } from '@ironclad/rivet-core';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsState, nodesByIdState, nodesState } from '../state/graph';

export function useDuplicateNode() {
  const nodesById = useRecoilValue(nodesByIdState);
  const setNodes = useSetRecoilState(nodesState);
  const [connections, setConnections] = useRecoilState(connectionsState);

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
    setNodes((nodes) => [...nodes, newNode]);

    // Copy the connections to the input ports
    const oldNodeConnections = connections.filter((c) => c.inputNodeId === nodeId);
    const newNodeConnections = oldNodeConnections.map((c) => ({
      ...c,
      inputNodeId: newNode.id,
    }));
    setConnections([...connections, ...newNodeConnections]);
  };
}
