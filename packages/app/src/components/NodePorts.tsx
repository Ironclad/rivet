import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { FC, MouseEvent } from 'react';
import { useNodeIO } from '../hooks/useGetNodeIO.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { Port } from './Port.js';
import { ErrorBoundary } from 'react-error-boundary';
import { WireDef } from './WireLayer';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';

export type NodePortsProps = {
  node: ChartNode;
  connections: NodeConnection[];
  zoomedOut?: boolean;
  draggingWire: WireDef | undefined;
  closestPortToDraggingWire: { nodeId: NodeId; portId: PortId } | undefined;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
};

export const NodePortsRenderer: FC<NodePortsProps> = ({ ...props }) => {
  return (
    <ErrorBoundary fallback={<div />}>
      <NodePorts {...props} />
    </ErrorBoundary>
  );
};

export const NodePorts: FC<NodePortsProps> = ({
  node,
  connections,
  draggingWire,
  closestPortToDraggingWire,
  onWireStartDrag,
  onWireEndDrag,
}) => {
  const { inputDefinitions, outputDefinitions } = useNodeIO(node.id)!;

  const handlePortMouseDown = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    onWireStartDrag?.(event, node.id, port, isInput);
  });

  const handlePortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
    onWireEndDrag?.(event, node.id, port);
  });

  useDependsOnPlugins();

  return (
    <div className="node-ports">
      <div className="input-ports">
        {inputDefinitions.map((input) => {
          const connected =
            connections.some((conn) => conn.inputNodeId === node.id && conn.inputId === input.id) ||
            (draggingWire?.endNodeId === node.id && draggingWire?.endPortId === input.id);
          return (
            <Port
              title={input.title}
              id={input.id}
              input
              connected={connected}
              key={`input-${input.id}`}
              nodeId={node.id}
              canDragTo={draggingWire ? !draggingWire.startPortIsInput : false}
              closest={closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === input.id}
              onMouseDown={handlePortMouseDown}
              onMouseUp={handlePortMouseUp}
            />
          );
        })}
      </div>
      <div className="output-ports">
        {outputDefinitions.map((output) => {
          const connected =
            connections.some((conn) => conn.outputNodeId === node.id && conn.outputId === output.id) ||
            (draggingWire?.startNodeId === node.id && draggingWire?.startPortId === output.id);
          return (
            <Port
              title={output.title}
              id={output.id}
              connected={connected}
              key={`output-${output.id}`}
              nodeId={node.id}
              canDragTo={draggingWire ? draggingWire.startPortIsInput : false}
              closest={closestPortToDraggingWire?.nodeId === node.id && closestPortToDraggingWire.portId === output.id}
              onMouseDown={handlePortMouseDown}
              onMouseUp={handlePortMouseUp}
            />
          );
        })}
      </div>
    </div>
  );
};
