import { useDraggable } from '@dnd-kit/core';
import {
  ChartNode,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  PortId,
} from '../model/NodeBase';
import { MouseEvent, FC } from 'react';
import { createUnknownNodeInstance } from '../model/Nodes';
import { useRecoilValue } from 'recoil';
import { canvasPositionState } from '../state/graphBuilder';
import { ViewNode } from './ViewNode';

interface DraggableNodeProps {
  node: ChartNode;
  connections?: NodeConnection[];
  isSelected?: boolean;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onNodeSelected: (node: ChartNode) => void;
}

export const DraggableNode: FC<DraggableNodeProps> = ({
  node,
  connections = [],
  isSelected = false,
  onWireStartDrag,
  onWireEndDrag,
  onNodeSelected,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });
  const { zoom } = useRecoilValue(canvasPositionState);

  return (
    <ViewNode
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
      onSelectNode={() => {
        onNodeSelected(node);
      }}
    />
  );
};

export function getNodePortPosition(
  nodes: ChartNode[],
  nodeId: NodeId,
  portId: PortId,
  clientToCanvasPosition: (clientX: number, clientY: number) => { x: number; y: number },
  getConnectionsForNode: (node: ChartNode) => NodeConnection[],
): { x: number; y: number } {
  const node = nodes.find((node) => node.id === nodeId);
  if (node && portId) {
    const nodeImpl = createUnknownNodeInstance(node);
    let isInput = true;
    const foundInput = nodeImpl.getInputDefinitions(getConnectionsForNode(node)).find((input) => input.id === portId);
    let foundPort: NodeInputDefinition | NodeOutputDefinition | undefined = foundInput;
    if (!foundPort) {
      isInput = false;
      foundPort = nodeImpl.getOutputDefinitions(getConnectionsForNode(node)).find((output) => output.id === portId);
    }

    if (foundPort) {
      const portElement = document.querySelector(
        `.node[data-node-id="${node.id}"] .${isInput ? 'input-port' : 'output-port'}[data-port-id="${foundPort.id}"]`,
      );
      if (portElement) {
        const rect = portElement.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
    }
  }
  return { x: 0, y: 0 };
}
