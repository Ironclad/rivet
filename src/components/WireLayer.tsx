import { FC, useCallback, useEffect, useState } from 'react';
import { NodeConnection, NodeId, PortId, ChartNode } from '../model/NodeBase';
import { css } from '@emotion/react';
import { Wire } from './Wire';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';

export type WireDef = {
  startNodeId: NodeId;
  startPortId: PortId;
  endNodeId?: NodeId;
  endPortId?: PortId;
};

type WireLayerProps = {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];
  draggingWire?: WireDef;
};

const wiresStyles = css`
  width: 100%;
  height: 100%;
  pointer-events: none;

  path {
    stroke-width: 2;
    stroke-lineap: butt;
    fill: none;
    stroke: gray;
  }

  .selected {
    stroke: blue;
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

  return (
    <svg css={wiresStyles}>
      {draggingWire && (
        <Wire
          nodes={nodes}
          connection={{
            nodeId: draggingWire.startNodeId,
            portId: draggingWire.startPortId,
            toX: mousePosition.x,
            toY: mousePosition.y,
          }}
          selected={false}
        />
      )}
      {connections.map((connection) => (
        <Wire
          nodes={nodes}
          connection={connection}
          selected={false}
          key={`wire-${connection.inputId}-${connection.inputNodeId}`}
        />
      ))}
    </svg>
  );
};
