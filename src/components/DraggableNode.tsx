import { useDraggable } from '@dnd-kit/core';
import {
  ChartNode,
  NodeId,
  NodeInputDefinition,
  NodeInputId,
  NodeOutputDefinition,
  NodeOutputId,
} from '../model/NodeBase';
import { CSSProperties, FC, HTMLAttributes, forwardRef, useCallback } from 'react';

interface DraggableNodeProps {
  node: ChartNode<string, unknown>;
  onWireStartDrag?: (
    event: React.MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: NodeInputId | NodeOutputId,
  ) => void;
  onWireEndDrag?: (
    event: React.MouseEvent<HTMLElement>,
    endNodeId: NodeId,
    endPortId: NodeInputId | NodeOutputId,
  ) => void;
}

export const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onWireStartDrag, onWireEndDrag }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: node.id });

  return (
    <ViewNode
      ref={setNodeRef}
      node={node}
      isDragging={isDragging}
      xDelta={transform?.x}
      yDelta={transform?.y}
      nodeAttributes={attributes}
      handleAttributes={listeners}
      onWireEndDrag={onWireEndDrag}
      onWireStartDrag={onWireStartDrag}
    />
  );
};

export type ViewNodeProps = {
  node: ChartNode<string, unknown>;
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  onWireStartDrag?: (
    event: React.MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: NodeInputId | NodeOutputId,
  ) => void;
  onWireEndDrag?: (
    event: React.MouseEvent<HTMLElement>,
    endNodeId: NodeId,
    endPortId: NodeInputId | NodeOutputId,
  ) => void;

  nodeAttributes?: HTMLAttributes<HTMLDivElement>;
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
};

export const ViewNode = forwardRef<HTMLDivElement, ViewNodeProps>(
  (
    {
      node,
      handleAttributes,
      nodeAttributes,
      xDelta = 0,
      yDelta = 0,
      isDragging,
      isOverlay,
      onWireEndDrag,
      onWireStartDrag,
    },
    ref,
  ) => {
    const style: CSSProperties = {
      opacity: isDragging ? '0' : '',
      transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px)`,
    };

    const handlePortMouseDown = useCallback(
      (event: React.MouseEvent<HTMLDivElement>, port: NodeInputId | NodeOutputId) => {
        event.stopPropagation();
        event.preventDefault();
        onWireStartDrag?.(event, node.id, port);
      },
      [onWireStartDrag, node.id],
    );

    const handlePortMouseUp = useCallback(
      (event: React.MouseEvent<HTMLDivElement>, port: NodeInputId | NodeOutputId) => {
        event.stopPropagation();
        event.preventDefault();
        onWireEndDrag?.(event, node.id, port);
      },
      [onWireEndDrag, node.id],
    );

    return (
      <div
        className={isOverlay ? 'node overlayNode' : 'node'}
        ref={ref}
        style={style}
        {...nodeAttributes}
        data-node-id={node.id}
      >
        <div className="node-title" {...handleAttributes}>
          {node.title}
        </div>
        <div className="node-body"></div>
        <div className="node-ports">
          <div className="input-ports">
            {node.inputDefinitions.map((input) => (
              <div key={input.id} className="port">
                <div
                  className="port-circle input-port"
                  onMouseDown={(e) => handlePortMouseDown(e, input.id)}
                  onMouseUp={(e) => handlePortMouseUp(e, input.id)}
                  data-port-id={input.id}
                />
                <div className="port-label">{input.title}</div>
              </div>
            ))}
          </div>
          <div className="output-ports">
            {node.outputDefinitions.map((output) => (
              <div key={output.id} className="port">
                <div
                  className="port-circle output-port"
                  onMouseDown={(e) => handlePortMouseDown(e, output.id)}
                  onMouseUp={(e) => handlePortMouseUp(e, output.id)}
                  data-port-id={output.id}
                />
                <div className="port-label">{output.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

export function getNodePortPosition(
  nodes: ChartNode<string, unknown>[],
  nodeId: NodeId,
  portId: NodeInputId | NodeOutputId,
): { x: number; y: number } {
  const node = nodes.find((node) => node.id === nodeId);
  if (node && portId) {
    let isInput = true;
    const foundInput = node.inputDefinitions.find((input) => input.id === portId);
    let foundPort: NodeInputDefinition | NodeOutputDefinition | undefined = foundInput;
    if (!foundPort) {
      isInput = false;
      foundPort = node.outputDefinitions.find((output) => output.id === portId);
    }

    if (foundPort) {
      const portElement = document.querySelector(
        `.node[data-node-id="${node.id}"] .${isInput ? 'input-port' : 'output-port'}[data-port-id="${foundPort.id}"]`,
      );
      if (portElement) {
        const rect = portElement.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }
  }
  return { x: 0, y: 0 };
}
