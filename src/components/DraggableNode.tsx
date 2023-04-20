import { useDraggable } from '@dnd-kit/core';
import {
  ChartNode,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  PortId,
} from '../model/NodeBase';
import { CSSProperties, HTMLAttributes, forwardRef, useCallback, MouseEvent, FC, memo } from 'react';
import clsx from 'clsx';
import { Nodes, createNodeInstance, createUnknownNodeInstance } from '../model/Nodes';
import { ReactComponent as SettingsCogIcon } from 'majesticons/line/settings-cog-line.svg';
import { match } from 'ts-pattern';
import { PromptNodeBody } from './nodeBodies/PromptNodeBody';
import { PromptNode } from '../model/nodes/PromptNode';
import { ChatNode } from '../model/nodes/ChatNode';
import { ChatNodeBody } from './nodeBodies/ChatNodeBody';

interface DraggableNodeProps {
  node: ChartNode<string, unknown>;
  connections?: NodeConnection[];
  isSelected?: boolean;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onNodeSelected: (node: ChartNode<string, unknown>) => void;
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

  return (
    <ViewNode
      ref={setNodeRef}
      isSelected={isSelected}
      node={node}
      connections={connections}
      isDragging={isDragging}
      xDelta={transform?.x}
      yDelta={transform?.y}
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

export type ViewNodeProps = {
  node: ChartNode<string, unknown>;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  onWireStartDrag?: (event: MouseEvent<HTMLElement>, startNodeId: NodeId, startPortId: PortId) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
  onSelectNode?: () => void;

  nodeAttributes?: HTMLAttributes<HTMLDivElement>;
  handleAttributes?: HTMLAttributes<HTMLDivElement>;
};

export const ViewNode = memo(
  forwardRef<HTMLDivElement, ViewNodeProps>(
    (
      {
        node,
        connections = [],
        handleAttributes,
        nodeAttributes,
        xDelta = 0,
        yDelta = 0,
        isDragging,
        isOverlay,
        isSelected,
        onWireEndDrag,
        onWireStartDrag,
        onSelectNode,
      },
      ref,
    ) => {
      const style: CSSProperties = {
        opacity: isDragging ? '0' : '',
        transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px)`,
        zIndex: node.visualData.zIndex ?? 0,
      };

      const handlePortMouseDown = useCallback(
        (event: MouseEvent<HTMLDivElement>, port: PortId) => {
          event.stopPropagation();
          event.preventDefault();
          onWireStartDrag?.(event, node.id, port);
        },
        [onWireStartDrag, node.id],
      );

      const handlePortMouseUp = useCallback(
        (event: MouseEvent<HTMLDivElement>, port: PortId) => {
          event.stopPropagation();
          event.preventDefault();
          onWireEndDrag?.(event, node.id, port);
        },
        [onWireEndDrag, node.id],
      );

      const handleEditClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          onSelectNode?.();
        },
        [onSelectNode],
      );

      const handleEditMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
      }, []);

      const nodeImpl = createNodeInstance(node as Nodes);

      const body = getNodeBody(node);

      return (
        <div
          className={clsx('node', { overlayNode: isOverlay, selected: isSelected })}
          ref={ref}
          style={style}
          {...nodeAttributes}
          data-node-id={node.id}
          data-contextmenutype={`node-${node.type}`}
        >
          <div className="node-title">
            <div className="title-text">{node.title}</div>
            <div className="grab-area" {...handleAttributes} />
            <div className="title-controls">
              <button className="edit-button" onClick={handleEditClick} onMouseDown={handleEditMouseDown} title="Edit">
                <SettingsCogIcon />
              </button>
            </div>
          </div>
          <div className="node-body">{body}</div>
          <div className="node-ports">
            <div className="input-ports">
              {nodeImpl.getInputDefinitions(connections).map((input) => {
                const connected = connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === input.id);
                return (
                  <div key={input.id} className={clsx('port', { connected })}>
                    <div
                      className="port-circle input-port"
                      onMouseDown={(e) => handlePortMouseDown(e, input.id)}
                      onMouseUp={(e) => handlePortMouseUp(e, input.id)}
                      data-port-id={input.id}
                    />
                    <div className="port-label">{input.title}</div>
                  </div>
                );
              })}
            </div>
            <div className="output-ports">
              {nodeImpl.getOutputDefinitions(connections).map((output) => {
                const connected = connections.some(
                  (conn) => conn.outputNodeId === node.id && conn.outputId === output.id,
                );
                return (
                  <div key={output.id} className={clsx('port', { connected })}>
                    <div
                      className="port-circle output-port"
                      onMouseDown={(e) => handlePortMouseDown(e, output.id)}
                      onMouseUp={(e) => handlePortMouseUp(e, output.id)}
                      data-port-id={output.id}
                    />
                    <div className="port-label">{output.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    },
  ),
);

export function getNodePortPosition(
  nodes: ChartNode<string, unknown>[],
  nodeId: NodeId,
  portId: PortId,
  getConnectionsForNode: (node: ChartNode<string, unknown>) => NodeConnection[],
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
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }
  }
  return { x: 0, y: 0 };
}

function getNodeBody(node: ChartNode<string, unknown>) {
  return match(node)
    .with({ type: 'prompt' }, (node) => <PromptNodeBody node={node as PromptNode} />)
    .with({ type: 'chat' }, (node) => <ChatNodeBody node={node as ChatNode} />)
    .otherwise(() => <div>Unknown node type</div>);
}
