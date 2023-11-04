import { type FC, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { ConditionallyRenderWire, PartialWire } from './Wire.js';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { ErrorBoundary } from 'react-error-boundary';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { draggingWireClosestPortState } from '../state/graphBuilder.js';
import { orderBy } from 'lodash-es';
import { ioDefinitionsState, nodesByIdState } from '../state/graph';
import { type PortPositions } from './NodeCanvas';
import { lastRunDataByNodeState, selectedProcessPageNodesState } from '../state/dataFlow';
import select from '@atlaskit/select/dist/types/entry-points/select';

const wiresStyles = css`
  width: 100%;
  height: 100%;
  pointer-events: none;

  path {
    stroke-linecap: butt;
    fill: none;
    stroke: gray;
  }

  .wire.isNotRan {
    stroke: var(--grey-lightish);
    stroke-dasharray: 5;
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
  highlightedPort?: {
    nodeId: NodeId;
    isInput: boolean;
    portId: PortId;
  };
};

export const WireLayer: FC<WireLayerProps> = ({
  connections,
  draggingWire,
  highlightedNodes,
  portPositions,
  highlightedPort,
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const setClosestPort = useSetRecoilState(draggingWireClosestPortState);
  const ioByNode = useRecoilValue(ioDefinitionsState);

  // Is this too inefficient?
  const lastRunDataByNode = useRecoilValue(lastRunDataByNodeState);
  const selectedProcessPageNodes = useRecoilValue(selectedProcessPageNodesState);

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
            const io = ioByNode[nodeId!];
            const definition = io!.inputDefinitions.find((def) => def.id === portId)!;

            setClosestPort({ nodeId, portId, element: closestHoverElem.parentElement!, definition });
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

  const lastRun = useRecoilValue(lastRunDataByNodeState);

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
                isNotRan={false}
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
          const isHighlightedNode =
            highlightedNodes?.includes(connection.inputNodeId) || highlightedNodes?.includes(connection.outputNodeId);

          const isCurrentlyRunning = lastRun[connection.inputNodeId]?.some(
            (run) => run.data.status?.type === 'running',
          );

          const isHighlightedPort =
            highlightedPort &&
            (highlightedPort.isInput ? connection.inputId : connection.outputId) === highlightedPort.portId &&
            (highlightedPort.isInput ? connection.inputNodeId : connection.outputNodeId) === highlightedPort.nodeId;

          // Too heavyweight for here?
          const outputNodeSelectedProcessPage = selectedProcessPageNodes[connection.outputNodeId];
          const lastRunData = lastRunDataByNode[connection.outputNodeId];
          let isNotRan = false;
          if (lastRunData && outputNodeSelectedProcessPage != null) {
            const selectedExecution =
              outputNodeSelectedProcessPage === 'latest'
                ? lastRunData[lastRunData.length - 1]
                : lastRunData[outputNodeSelectedProcessPage];
            if (selectedExecution?.data.outputData) {
              const outputValue = selectedExecution.data.outputData[connection.outputId];
              isNotRan = outputValue?.type === 'control-flow-excluded';
            }
          }

          const highlighted = isHighlightedNode || isCurrentlyRunning || isHighlightedPort;
          return (
            <ErrorBoundary fallback={<></>} key={`wire-${connection.inputId}-${connection.inputNodeId}`}>
              <ConditionallyRenderWire
                connection={connection}
                selected={false}
                highlighted={!!highlighted}
                nodesById={nodesById}
                portPositions={portPositions}
                isNotRan={isNotRan}
              />
            </ErrorBoundary>
          );
        })}
      </g>
    </svg>
  );
};
