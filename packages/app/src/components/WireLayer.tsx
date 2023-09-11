import { FC, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { NodeConnection, NodeId, PortId } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { ConditionallyRenderWire, PartialWire } from './Wire.js';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { draggingWireClosestPortState } from '../state/graphBuilder.js';
import { orderBy } from 'lodash-es';
import { nodesByIdState } from '../state/graph';
import { PortPositions } from './NodeCanvas';

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

export type WireDef = {
  startNodeId: NodeId;
  startPortId: PortId;
  endNodeId?: NodeId;
  endPortId?: PortId;
  startPortIsInput: boolean;
};

type WireLayerProps = {
  connections: NodeConnection[];
  draggingWire?: WireDef;
  highlightedNodes?: NodeId[];
  portPositions: PortPositions;
};

export const WireLayer: FC<WireLayerProps> = ({ connections, draggingWire, highlightedNodes, portPositions }) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const setClosestPort = useSetRecoilState(draggingWireClosestPortState);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });

      if (draggingWire) {
        const hoverElems = document
          .elementsFromPoint(clientX, clientY)
          .filter((elem) => elem.classList.contains('port-hover-area'));

        if (hoverElems.length === 0) {
          setClosestPort(undefined);
        } else {
          const closestHoverElem = orderBy(hoverElems, (elem) => {
            const elemPosition = elem.getBoundingClientRect();
            const elemCenter = {
              x: elemPosition.x + elemPosition.width / 2,
              y: elemPosition.y + elemPosition.height / 2,
            };
            const distance = Math.sqrt(Math.pow(clientX - elemCenter.x, 2) + Math.pow(clientY - elemCenter.y, 2));
            return distance;
          })[0] as HTMLElement;

          const portId = closestHoverElem!.parentElement!.dataset.portid as PortId | undefined;
          const nodeId = closestHoverElem!.parentElement!.dataset.nodeid as NodeId | undefined;

          if (portId && nodeId) {
            setClosestPort({ nodeId, portId });
          } else {
            setClosestPort(undefined);
          }
        }
      } else {
        setClosestPort(undefined);
      }
    },
    [draggingWire, setClosestPort],
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useLayoutEffect(() => {}, [draggingWire, mousePosition.x, mousePosition.y, setClosestPort]);

  const { canvasPosition, clientToCanvasPosition } = useCanvasPositioning();
  const mousePositionCanvas = clientToCanvasPosition(mousePosition.x, mousePosition.y);

  const nodesById = useRecoilValue(nodesByIdState);

  return (
    <svg css={wiresStyles}>
      <g transform={`scale(${canvasPosition.zoom}) translate(${canvasPosition.x}, ${canvasPosition.y})`}>
        {draggingWire && (
          <ErrorBoundary fallback={<></>} key="wire-inprogress">
            {draggingWire.endNodeId && draggingWire.endPortId ? (
              <ConditionallyRenderWire
                connection={{
                  outputNodeId: draggingWire.startNodeId,
                  outputId: draggingWire.startPortId,
                  inputNodeId: draggingWire.endNodeId,
                  inputId: draggingWire.endPortId,
                }}
                selected={false}
                highlighted={!!(draggingWire.endNodeId && draggingWire.endPortId)}
                nodesById={nodesById}
                portPositions={portPositions}
              />
            ) : (
              <PartialWire
                connection={{
                  nodeId: draggingWire.startNodeId,
                  portId: draggingWire.startPortId,
                  toX: mousePositionCanvas.x,
                  toY: mousePositionCanvas.y,
                }}
                portPositions={portPositions}
              />
            )}
          </ErrorBoundary>
        )}
        {connections.map((connection) => {
          const highlighted =
            highlightedNodes?.includes(connection.inputNodeId) || highlightedNodes?.includes(connection.outputNodeId);
          return (
            <ErrorBoundary fallback={<></>} key={`wire-${connection.inputId}-${connection.inputNodeId}`}>
              <ConditionallyRenderWire
                connection={connection}
                selected={false}
                highlighted={!!highlighted}
                nodesById={nodesById}
                portPositions={portPositions}
              />
            </ErrorBoundary>
          );
        })}
      </g>
    </svg>
  );
};
