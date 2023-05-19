import { FC, useCallback, useEffect, useState } from 'react';
import { NodeConnection, NodeId, PortId, ChartNode } from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import { Wire } from './Wire';

export type WireDef = {
  startNodeId: NodeId;
  startPortId: PortId;
  endNodeId?: NodeId;
  endPortId?: PortId;
};

type WireLayerProps = {
  nodes: ChartNode[];
  connections: NodeConnection[];
  draggingWire?: WireDef;
  highlightedNodes?: NodeId[];
};

const wiresStyles = css`
  width: 100%;
  height: 100%;
  pointer-events: none;

  path {
    stroke-linecap: butt;
    fill: none;
    stroke: gray;
  }

  .selected {
    stroke: blue;
  }

  .wire.highlighted {
    stroke: var(--primary);
    transition: stroke 0.2s ease-out;
  }
`;

export const WireLayer: FC<WireLayerProps> = ({ nodes, connections, draggingWire, highlightedNodes }) => {
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
          connection={{
            nodeId: draggingWire.startNodeId,
            portId: draggingWire.startPortId,
            toX: mousePosition.x,
            toY: mousePosition.y,
          }}
          selected={false}
          highlighted={false}
        />
      )}
      {connections.map((connection) => {
        const highlighted =
          highlightedNodes?.includes(connection.inputNodeId) || highlightedNodes?.includes(connection.outputNodeId);
        return (
          <Wire
            connection={connection}
            selected={false}
            key={`wire-${connection.inputId}-${connection.inputNodeId}`}
            highlighted={!!highlighted}
          />
        );
      })}
    </svg>
  );
};
