import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { clipboardState } from '../state/clipboard';
import { connectionsState, graphState, nodesState } from '../state/graph';
import { type NodeId, newId, type NodeConnection } from '@ironclad/rivet-core';
import { useCanvasPositioning } from './useCanvasPositioning';
import { produce } from 'immer';
import { selectedNodesState } from '../state/graphBuilder';
import { isNotNull } from '../utils/genericUtilFunctions';

export function usePasteNodes() {
  const clipboard = useRecoilValue(clipboardState);
  const { clientToCanvasPosition } = useCanvasPositioning();
  const setNodes = useSetRecoilState(nodesState);
  const setSelectedNodeIds = useSetRecoilState(selectedNodesState);
  const setConnections = useSetRecoilState(connectionsState);

  const pasteNodes = (mousePosition: { x: number; y: number }) => {
    if (clipboard?.type !== 'nodes') {
      return;
    }

    const canvasPosition = clientToCanvasPosition(mousePosition.x, mousePosition.y);

    const boundingBoxOfCopiedNodes = clipboard.nodes.reduce(
      (acc, node) => {
        return {
          minX: Math.min(acc.minX, node.visualData.x),
          minY: Math.min(acc.minY, node.visualData.y),
          maxX: Math.max(acc.maxX, node.visualData.x + (node.visualData.width ?? 200)),
          maxY: Math.max(acc.maxY, node.visualData.y + 200),
        };
      },
      {
        minX: Number.MAX_SAFE_INTEGER,
        minY: Number.MAX_SAFE_INTEGER,
        maxX: Number.MIN_SAFE_INTEGER,
        maxY: Number.MIN_SAFE_INTEGER,
      },
    );

    const oldNewNodeIdMap: Record<NodeId, NodeId> = {};

    const newNodes = clipboard.nodes.map((node) => {
      return produce(node, (draft) => {
        const newNodeId = newId<NodeId>();
        oldNewNodeIdMap[node.id] = newNodeId;

        draft.id = newNodeId;

        // Move the bounding box of all the copied nodes, align the top-left of it with the mouse position
        draft.visualData.x = canvasPosition.x + (node.visualData.x - boundingBoxOfCopiedNodes.minX);
        draft.visualData.y = canvasPosition.y + (node.visualData.y - boundingBoxOfCopiedNodes.minY);
      });
    });

    setNodes((nodes) => [...nodes, ...newNodes]);
    setSelectedNodeIds(newNodes.map((node) => node.id));

    const newConnections: NodeConnection[] = clipboard.connections
      .map((connection): NodeConnection | undefined => {
        const inputNodeId = oldNewNodeIdMap[connection.inputNodeId];
        const outputNodeId = oldNewNodeIdMap[connection.outputNodeId];

        if (!inputNodeId || !outputNodeId) {
          return undefined;
        }

        return {
          ...connection,
          inputNodeId,
          outputNodeId,
        };
      })
      .filter(isNotNull);

    setConnections((connections) => [...connections, ...newConnections]);
  };

  return pasteNodes;
}
