import { useDraggable } from '@dnd-kit/core';
import {
  ChartNode,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  PortId,
} from '@ironclad/nodai-core';
import { MouseEvent, FC } from 'react';
import { useRecoilValue } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder';
import { VisualNode, nodePortCache } from './VisualNode';
import { useStableCallback } from '../hooks/useStableCallback';

interface DraggableNodeProps {
  node: ChartNode;
  connections?: NodeConnection[];
  isSelected?: boolean;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onNodeSelected: (node: ChartNode) => void;
  onNodeWidthChanged?: (node: ChartNode, newWidth: number) => void;
  onMouseOver?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onMouseOut?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
}

export const DraggableNode: FC<DraggableNodeProps> = ({
  node,
  connections = [],
  isSelected = false,
  onWireStartDrag,
  onWireEndDrag,
  onNodeSelected,
  onNodeWidthChanged,
  onMouseOver,
  onMouseOut,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });
  const { zoom } = useRecoilValue(canvasPositionState);

  return (
    <VisualNode
      ref={setNodeRef}
      isSelected={isSelected}
      node={node}
      connections={connections}
      isDragging={isDragging}
      xDelta={transform ? transform.x / zoom : 0}
      yDelta={transform ? transform.y / zoom : 0}
      nodeAttributes={attributes}
      handleAttributes={listeners}
      onWireEndDrag={onWireEndDrag}
      onWireStartDrag={onWireStartDrag}
      onSelectNode={useStableCallback(() => {
        onNodeSelected(node);
      })}
      onNodeWidthChanged={(width) => onNodeWidthChanged?.(node, width)}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    />
  );
};
