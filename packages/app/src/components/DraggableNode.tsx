import { useDraggable } from '@dnd-kit/core';
import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { MouseEvent, FC } from 'react';
import { VisualNode } from './VisualNode.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { ErrorBoundary } from 'react-error-boundary';

interface DraggableNodeProps {
  node: ChartNode;
  connections?: NodeConnection[];
  isSelected?: boolean;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  canvasZoom: number;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onNodeSelected?: (node: ChartNode, multi: boolean) => void;
  onNodeStartEditing?: (node: ChartNode) => void;
  onNodeSizeChanged?: (node: ChartNode, newWidth: number, newHeight: number) => void;
  onMouseOver?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onMouseOut?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
}

export const DraggableNode: FC<DraggableNodeProps> = ({
  node,
  connections = [],
  isSelected = false,
  canvasZoom,
  onWireStartDrag,
  onWireEndDrag,
  onNodeSelected,
  onNodeStartEditing,
  onNodeSizeChanged,
  onMouseOver,
  onMouseOut,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });

  return (
    <ErrorBoundary fallback={<div>Failed to render node</div>}>
      <VisualNode
        ref={setNodeRef}
        isSelected={isSelected}
        node={node}
        connections={connections}
        isDragging={isDragging}
        xDelta={transform ? transform.x / canvasZoom : 0}
        yDelta={transform ? transform.y / canvasZoom : 0}
        nodeAttributes={attributes}
        handleAttributes={listeners}
        onWireEndDrag={onWireEndDrag}
        onWireStartDrag={onWireStartDrag}
        onSelectNode={useStableCallback((multi: boolean) => {
          onNodeSelected?.(node, multi);
        })}
        onStartEditing={useStableCallback(() => {
          onNodeStartEditing?.(node);
        })}
        onNodeSizeChanged={(width, height) => onNodeSizeChanged?.(node, width, height)}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />
    </ErrorBoundary>
  );
};
