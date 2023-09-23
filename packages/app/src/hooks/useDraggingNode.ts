import { type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { produce } from 'immer';
import { useCallback } from 'react';
import { type ChartNode, type NodeId } from '@ironclad/rivet-core';
import { useRecoilState, useRecoilValue } from 'recoil';
import { canvasPositionState, draggingNodesState, selectedNodesState } from '../state/graphBuilder.js';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { nodesByIdState, nodesState } from '../state/graph.js';

export const useDraggingNode = (onNodesChanged: (nodes: ChartNode[]) => void) => {
  const selectedNodeIds = useRecoilValue(selectedNodesState);
  const [draggingNodes, setDraggingNodes] = useRecoilState(draggingNodesState);
  const canvasPosition = useRecoilValue(canvasPositionState);
  const nodes = useRecoilValue(nodesState);
  const nodesById = useRecoilValue(nodesByIdState);

  const onNodeStartDrag = useCallback(
    (e: DragStartEvent) => {
      const draggedNodeId = e.active.id as NodeId;

      const nodesToDrag =
        selectedNodeIds.length > 0
          ? [...new Set([...selectedNodeIds, draggedNodeId])].map((id) => nodesById[id]).filter(isNotNull)
          : [nodesById[draggedNodeId]].filter(isNotNull);

      setDraggingNodes(nodesToDrag);

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

      onNodesChanged?.(
        produce(nodes, (draft) => {
          for (const nodeId of nodeIds) {
            const node = draft.find((n) => n.id === nodeId);
            if (node) {
              node.visualData.x += actualDelta.x;
              node.visualData.y += actualDelta.y;
            }
          }
        }),
      );
    },
    [nodes, onNodesChanged, canvasPosition.zoom, setDraggingNodes, draggingNodes],
  );

  return {
    draggingNodes,
    onNodeStartDrag,
    onNodeDragged,
  };
};
