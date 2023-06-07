import { FC, useCallback, useEffect, useState } from 'react';
import { NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { ConditionallyRenderWire } from './Wire';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';

export type WireDef = {
  startNodeId: NodeId;
  startPortId: PortId;
  endNodeId?: NodeId;
  endPortId?: PortId;
};

type WireLayerProps = {
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

export const WireLayer: FC<WireLayerProps> = ({ connections, draggingWire, highlightedNodes }) => {
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

  const { canvasPosition, clientToCanvasPosition } = useCanvasPositioning();
  const mousePositionCanvas = clientToCanvasPosition(mousePosition.x, mousePosition.y);

  return (
    <svg css={wiresStyles}>
      <g transform={`scale(${canvasPosition.zoom}) translate(${canvasPosition.x}, ${canvasPosition.y})`}>
        {draggingWire && (
          <ConditionallyRenderWire
            connection={{
              nodeId: draggingWire.startNodeId,
              portId: draggingWire.startPortId,
              toX: mousePositionCanvas.x,
              toY: mousePositionCanvas.y,
            }}
            selected={false}
            highlighted={false}
            key="wire-inprogress"
          />
        )}
        {connections.map((connection) => {
          const highlighted =
            highlightedNodes?.includes(connection.inputNodeId) || highlightedNodes?.includes(connection.outputNodeId);
          return (
            <ConditionallyRenderWire
              connection={connection}
              selected={false}
              key={`wire-${connection.inputId}-${connection.inputNodeId}`}
              highlighted={!!highlighted}
            />
          );
        })}
      </g>
    </svg>
  );
};
