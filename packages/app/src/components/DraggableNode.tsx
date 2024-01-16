import { useDraggable } from '@dnd-kit/core';
import {
  type NodeInputDefinition,
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type PortId,
  type NodeOutputDefinition,
} from '@ironclad/rivet-core';
import { type MouseEvent, type FC } from 'react';
import type { HeightCache } from '../hooks/useNodeBodyHeight';
import { VisualNode } from './VisualNode.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { ErrorBoundary } from 'react-error-boundary';
import { type ProcessDataForNode } from '../state/dataFlow';
import { type DraggingWireDef } from '../state/graphBuilder';

interface DraggableNodeProps {
  heightCache: HeightCache;
  node: ChartNode;
  connections?: NodeConnection[];
  isSelected?: boolean;
  isKnownNodeType: boolean;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  canvasZoom: number;
  lastRun?: ProcessDataForNode[];
  processPage: number | 'latest';
  draggingWire?: DraggingWireDef;
  isZoomedOut: boolean;
  isPinned: boolean;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onNodeSelected?: (node: ChartNode, multi: boolean) => void;
  onNodeStartEditing?: (node: ChartNode) => void;
  onNodeSizeChanged?: (node: ChartNode, newWidth: number, newHeight: number) => void;
  onMouseOver?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onMouseOut?: (event: MouseEvent<HTMLElement>, nodeId: NodeId) => void;
  onPortMouseOver?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
  onPortMouseOut?: (
    event: MouseEvent<HTMLElement>,
    nodeId: NodeId,
    isInput: boolean,
    portId: PortId,
    definition: NodeInputDefinition | NodeOutputDefinition,
  ) => void;
}

export const DraggableNode: FC<DraggableNodeProps> = ({
  heightCache,
  node,
  connections = [],
  isSelected = false,
  canvasZoom,
  isKnownNodeType,
  lastRun,
  processPage,
  draggingWire,
  isZoomedOut,
  isPinned,
  onWireStartDrag,
  onWireEndDrag,
  onNodeSelected,
  onNodeStartEditing,
  onNodeSizeChanged,
  onMouseOver,
  onMouseOut,
  onPortMouseOver,
  onPortMouseOut,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });

  return (
    <ErrorBoundary fallback={<div>Failed to render node</div>}>
      <VisualNode
        ref={setNodeRef}
        isSelected={isSelected}
        heightCache={heightCache}
        node={node}
        connections={connections}
        isDragging={isDragging}
        xDelta={transform ? transform.x / canvasZoom : 0}
        yDelta={transform ? transform.y / canvasZoom : 0}
        nodeAttributes={attributes}
        handleAttributes={listeners}
        isKnownNodeType={isKnownNodeType}
        lastRun={lastRun}
        processPage={processPage}
        draggingWire={draggingWire}
        isZoomedOut={isZoomedOut}
        isPinned={isPinned}
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
        onPortMouseOver={onPortMouseOver}
        onPortMouseOut={onPortMouseOut}
      />
    </ErrorBoundary>
  );
};
