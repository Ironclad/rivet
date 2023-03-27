import { FC, useCallback, useEffect, useState } from 'react';
import { ChartNode, NodeConnection, NodeId, NodeInputId, NodeOutputId } from '../model/NodeBase';
import { getNodePortPosition } from './DraggableNode';
import { css } from '@emotion/react';
import { partition } from 'lodash-es';

export type WireDef = {
  startNodeId: NodeId;
  startPortId: NodeInputId | NodeOutputId;
  endNodeId?: NodeId;
  endPortId?: NodeInputId | NodeOutputId;
};

type WireLayerProps = {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];
  draggingWire?: WireDef;
};

const wiresStyles = css`
  width: 100%;
  height: 100%;

  path {
    stroke-width: 2;
    stroke-lineap: butt;
    fill: none;
    stroke: gray;
  }
`;

export const WireLayer: FC<WireLayerProps> = ({ nodes, connections, draggingWire }) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  const getOutputNode = useCallback(
    (connection: NodeConnection) => nodes.find((node) => node.id === connection.outputNodeId),
    [nodes],
  );

  const getOutputPort = useCallback(
    (connection: NodeConnection) =>
      getOutputNode(connection)?.outputDefinitions.find((port) => port.id === connection.outputId),
    [getOutputNode],
  );

  const getInputNode = useCallback(
    (connection: NodeConnection) => nodes.find((node) => node.id === connection.inputNodeId),
    [nodes],
  );

  const getInputPort = useCallback(
    (connection: NodeConnection) =>
      getInputNode(connection)?.inputDefinitions.find((port) => port.id === connection.inputId),
    [getInputNode],
  );

  return (
    <svg css={wiresStyles}>
      {draggingWire && (
        <path
          className="wire"
          d={calculateWirePath(
            getNodePortPosition(nodes, draggingWire.startNodeId, draggingWire.startPortId),
            draggingWire.endNodeId && draggingWire.endPortId
              ? getNodePortPosition(nodes, draggingWire.endNodeId, draggingWire.endPortId)
              : mousePosition,
          )}
        />
      )}
      {connections.map((connection) => {
        const outputPort = getOutputPort(connection);
        const inputPort = getInputPort(connection);
        if (outputPort && inputPort) {
          return (
            <path
              key={`${connection.outputNodeId}-${connection.outputId}-${connection.inputNodeId}-${connection.inputId}`}
              className="wire"
              d={calculateWirePath(
                getNodePortPosition(nodes, connection.outputNodeId, connection.outputId),
                getNodePortPosition(nodes, connection.inputNodeId, connection.inputId),
              )}
            />
          );
        }
        return null;
      })}
    </svg>
  );
};

function calculateWirePath(start: { x: number; y: number }, end: { x: number; y: number }): string {
  const deltaX = Math.abs(end.x - start.x);
  const xDir = start.x < end.x ? 1 : -1;
  const curveX1 = start.x + xDir * deltaX * 0.5;
  const curveY1 = start.y;
  const curveX2 = start.x + xDir * deltaX * 0.5;
  const curveY2 = end.y;
  return `M${start.x},${start.y} C${curveX1},${curveY1} ${curveX2},${curveY2} ${end.x},${end.y}`;
}
