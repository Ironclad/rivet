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
import { ReactComponent as SendIcon } from 'majesticons/solid/send.svg';
import { match } from 'ts-pattern';
import { PromptNodeBody, PromptNodeOutput } from './nodes/PromptNode';
import { PromptNode } from '../model/nodes/PromptNode';
import { ChatNode } from '../model/nodes/ChatNode';
import { ChatNodeBody, ChatNodeOutput } from './nodes/ChatNode';
import { lastRunData } from '../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { TextNode } from '../model/nodes/TextNode';
import { TextNodeBody, TextNodeOutput } from './nodes/TextNode';
import { ExtractRegexNodeBody, ExtractRegexNodeOutput } from './nodes/ExtractRegexNode';
import { ExtractRegexNode } from '../model/nodes/ExtractRegexNode';
import { CodeNodeBody, CodeNodeOutput } from './nodes/CodeNode';
import { CodeNode } from '../model/nodes/CodeNode';
import { MatchNodeBody, MatchNodeOutput } from './nodes/MatchNode';
import { MatchNode } from '../model/nodes/MatchNode';
import { UserInputNode } from '../model/nodes/UserInputNode';
import { UserInputNodeBody, UserInputNodeOutput } from './nodes/UserInputNode';
import { canvasPositionState } from '../state/graphBuilder';

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

export type ViewNodeProps = {
  node: ChartNode;
  connections?: NodeConnection[];
  xDelta?: number;
  yDelta?: number;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  scale?: number;
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
        scale,
        isSelected,
        onWireEndDrag,
        onWireStartDrag,
        onSelectNode,
      },
      ref,
    ) => {
      const lastRun = useRecoilValue(lastRunData(node.id));

      const style: CSSProperties = {
        opacity: isDragging ? '0' : '',
        transform: `translate(${node.visualData.x + xDelta}px, ${node.visualData.y + yDelta}px) scale(${scale ?? 1})`,
        zIndex: node.visualData.zIndex ?? 0,
        width: node.visualData.width,
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
            <div className="grab-area" {...handleAttributes}>
              <div className="title-text">{node.title}</div>
            </div>
            <div className="title-controls">
              <div className="last-run-status">
                {lastRun?.status ? (
                  match(lastRun.status)
                    .with({ status: 'ok' }, () => (
                      <div className="success">
                        <SendIcon />
                      </div>
                    ))
                    .with({ status: 'error' }, () => (
                      <div className="error">
                        <SendIcon />
                      </div>
                    ))
                    .exhaustive()
                ) : (
                  <></>
                )}
              </div>
              <button className="edit-button" onClick={handleEditClick} onMouseDown={handleEditMouseDown} title="Edit">
                <SettingsCogIcon />
              </button>
            </div>
          </div>
          <NodeBody node={node} />
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
          <NodeOutput node={node} />
        </div>
      );
    },
  ),
);

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

const NodeBody: FC<{ node: ChartNode }> = ({ node }) => {
  const body = match(node)
    .with({ type: 'prompt' }, (node) => <PromptNodeBody node={node as PromptNode} />)
    .with({ type: 'chat' }, (node) => <ChatNodeBody node={node as ChatNode} />)
    .with({ type: 'text' }, (node) => <TextNodeBody node={node as TextNode} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeBody node={node as ExtractRegexNode} />)
    .with({ type: 'code' }, (node) => <CodeNodeBody node={node as CodeNode} />)
    .with({ type: 'match' }, (node) => <MatchNodeBody node={node as MatchNode} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeBody node={node as UserInputNode} />)
    .otherwise(() => <div>Unknown node type</div>);

  return <div className="node-body">{body}</div>;
};

const NodeOutput: FC<{ node: ChartNode }> = ({ node }) => {
  const nodeOutput = useRecoilValue(lastRunData(node.id));

  const outputBody = match(node)
    .with({ type: 'prompt' }, (node) => <PromptNodeOutput node={node as PromptNode} />)
    .with({ type: 'chat' }, (node) => <ChatNodeOutput node={node as ChatNode} />)
    .with({ type: 'text' }, (node) => <TextNodeOutput node={node as TextNode} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeOutput node={node as ExtractRegexNode} />)
    .with({ type: 'code' }, (node) => <CodeNodeOutput node={node as CodeNode} />)
    .with({ type: 'match' }, (node) => <MatchNodeOutput node={node as MatchNode} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeOutput node={node as UserInputNode} />)
    .otherwise(() => null);

  if (!nodeOutput?.status) {
    return null;
  }

  return <div className={clsx('node-output', { errored: nodeOutput.status?.status === 'error' })}>{outputBody}</div>;
};
