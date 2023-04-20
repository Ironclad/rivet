import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import produce from 'immer';
import { useState, useCallback } from 'react';
import { ChartNode } from '../model/NodeBase';

export const useDraggingNode = (
  nodes: ChartNode<string, unknown>[],
  onNodesChanged: (nodes: ChartNode<string, unknown>[]) => void,
) => {
  const [draggingNode, setDraggingNode] = useState<ChartNode<string, unknown> | undefined>();

  const onNodeStartDrag = useCallback(
    (e: DragStartEvent) => {
      const node = nodes.find((node) => node.id === e.active.id);
      setDraggingNode(node!);

      // Update the zIndex of the dragged node
      const maxZIndex = nodes.reduce(
        (max, node) =>
          Math.max(max, node.visualData.zIndex && !Number.isNaN(node.visualData.zIndex) ? node.visualData.zIndex : 0),
        0,
      );
      onNodesChanged(
        nodes.map((n) => (n.id === node!.id ? { ...n, visualData: { ...n.visualData, zIndex: maxZIndex + 1 } } : n)),
      );
    },
    [nodes, onNodesChanged],
  );

  const onNodeDragged = useCallback(
    ({ active, delta }: DragEndEvent) => {
      const nodeId = active.id;

      setDraggingNode(undefined);

      onNodesChanged?.(
        produce(nodes, (draft) => {
          const node = draft.find((node) => node.id === nodeId);
          if (node) {
            node.visualData.x += delta.x;
            node.visualData.y += delta.y;
          }
        }),
      );
    },
    [nodes, onNodesChanged],
  );

  return {
    draggingNode,
    onNodeStartDrag,
    onNodeDragged,
  };
};
