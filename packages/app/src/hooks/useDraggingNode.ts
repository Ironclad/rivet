import { type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { produce } from 'immer';
import { useCallback, useState } from 'react';
import { type ChartNode, type NodeId } from '@ironclad/rivet-core';
import { useAtom, useAtomValue } from 'jotai';
import { canvasPositionState, draggingNodesState, selectedNodesState } from '../state/graphBuilder.js';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { nodesByIdState, nodesState } from '../state/graph.js';
import { type NodePosition, useMoveNodeCommand } from '../commands/moveNodeCommand';

export const useDraggingNode = (onNodesChanged: (nodes: ChartNode[]) => void) => {
  const selectedNodeIds = useAtomValue(selectedNodesState);
  const [draggingNodes, setDraggingNodes] = useAtom(draggingNodesState);
  const canvasPosition = useAtomValue(canvasPositionState);
  const nodes = useAtomValue(nodesState);
  const nodesById = useAtomValue(nodesByIdState);

  const [startPositions, setStartPositions] = useState<NodePosition[]>([]);

  const moveNode = useMoveNodeCommand();

  const onNodeStartDrag = useCallback(
    (e: DragStartEvent) => {
      const draggedNodeId = e.active.id as NodeId;

      const nodesToDrag =
        selectedNodeIds.length > 0
          ? [...new Set([...selectedNodeIds, draggedNodeId])].map((id) => nodesById[id]).filter(isNotNull)
          : [nodesById[draggedNodeId]].filter(isNotNull);

      setDraggingNodes(nodesToDrag);

      setStartPositions(
        nodesToDrag.map((n) => ({
          nodeId: n.id,
          position: { x: n.visualData.x, y: n.visualData.y },
        })),
      );

      // Update the zIndex of the dragged node
      const maxZIndex = nodes.reduce(
        (max, node) =>
          Math.max(max, node.visualData.zIndex && !Number.isNaN(node.visualData.zIndex) ? node.visualData.zIndex : 0),
        0,
      );
      onNodesChanged(
        nodes.map((n) => {
          const isDragging = nodesToDrag.some((node) => node.id === n.id);
          return isDragging ? { ...n, visualData: { ...n.visualData, zIndex: maxZIndex + 1 } } : n;
        }),
      );
    },
    [nodesById, nodes, onNodesChanged, setDraggingNodes, selectedNodeIds],
  );

  const onNodeDragged = useCallback(
    ({ delta }: DragEndEvent) => {
      const nodeIds = draggingNodes.map((n) => n.id);

      const actualDelta = {
        x: delta.x / canvasPosition.zoom,
        y: delta.y / canvasPosition.zoom,
      };

      setDraggingNodes([]);

      moveNode({
        moves: nodeIds.map((nodeId) => {
          const node = nodesById[nodeId];
          if (!node) {
            throw new Error(`Node with id ${nodeId} not found`);
          }

          const initialPosition = startPositions.find((p) => p.nodeId === nodeId);
          if (!initialPosition) {
            throw new Error(`Initial position not found for nodeId ${nodeId}`);
          }

          return {
            nodeId,
            position: {
              x: initialPosition.position.x + actualDelta.x,
              y: initialPosition.position.y + actualDelta.y,
            },
          };
        }),
      });
    },
    [canvasPosition.zoom, setDraggingNodes, draggingNodes, moveNode, nodesById, startPositions],
  );

  return {
    draggingNodes,
    onNodeStartDrag,
    onNodeDragged,
  };
};
