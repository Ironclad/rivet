import { ChartNode, NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { FC, MouseEvent } from 'react';
import { useRecoilValue } from 'recoil';
import { useGetNodeIO } from '../hooks/useGetNodeIO.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { draggingWireState, lastMousePositionState } from '../state/graphBuilder.js';
import { Port } from './Port.js';
import { useIsKnownNodeType } from '../hooks/useIsKnownNodeType';
import { ErrorBoundary } from 'react-error-boundary';

export type NodePortsProps = {
  node: ChartNode;
  connections: NodeConnection[];
  zoomedOut?: boolean;
  onWireStartDrag?: (
    event: MouseEvent<HTMLElement>,
    startNodeId: NodeId,
    startPortId: PortId,
    isInput: boolean,
  ) => void;
  onWireEndDrag?: (event: MouseEvent<HTMLElement>, endNodeId: NodeId, endPortId: PortId) => void;
};

export const NodePortsRenderer: FC<NodePortsProps> = ({ ...props }) => {
  const isKnownNodeType = useIsKnownNodeType(props.node.type);
  if (!isKnownNodeType) {
    return null;
  }

  return (
    <ErrorBoundary fallback={<div />}>
      <NodePorts {...props} />
    </ErrorBoundary>
  );
};

export const NodePorts: FC<NodePortsProps> = ({ node, connections, zoomedOut, onWireStartDrag, onWireEndDrag }) => {
  const getIO = useGetNodeIO();
  const { inputDefinitions, outputDefinitions } = getIO(node);
  const draggingWire = useRecoilValue(draggingWireState);

  const handlePortMouseDown = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId, isInput: boolean) => {
    event.stopPropagation();
    event.preventDefault();
    onWireStartDrag?.(event, node.id, port, isInput);
  });

  const handlePortMouseUp = useStableCallback((event: MouseEvent<HTMLDivElement>, port: PortId) => {
    // event.stopPropagation();
    // event.preventDefault();
    onWireEndDrag?.(event, node.id, port);
  });

  // Force rerender on mouse move to update position 🤷‍♂️
  useRecoilValue(lastMousePositionState);

  const isKnownNodeType = useIsKnownNodeType(node.type);

  if (!isKnownNodeType) {
    return null;
  }

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
              onMouseDown={handlePortMouseDown}
              onMouseUp={handlePortMouseUp}
            />
          );
        })}
      </div>
    </div>
  );
};
