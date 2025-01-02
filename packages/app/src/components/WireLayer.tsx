import { type FC, useCallback, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { ConditionallyRenderWire, PartialWire, getConnectionCacheKeys, getNodePortPosition } from './Wire.js';
import { canvasToClientPosition, useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { ErrorBoundary } from 'react-error-boundary';
import { draggingWireClosestPortState } from '../state/graphBuilder.js';
import { orderBy } from 'lodash-es';
import { ioDefinitionsState, nodesByIdState } from '../state/graph';
import { type PortPositions } from './NodeCanvas';
import { type RunDataByNodeId, lastRunDataByNodeState, selectedProcessPageNodesState } from '../state/dataFlow';
import select from '@atlaskit/select/dist/types/entry-points/select';
import { useStableCallback } from '../hooks/useStableCallback';
import { lineCrossesViewport } from '../utils/lineClipping';
import { useAtom, useAtomValue } from 'jotai';

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
  draggingNode: boolean;
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
  draggingNode,
  highlightedNodes,
  portPositions,
  highlightedPort,
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [closestPort, setClosestPort] = useAtom(draggingWireClosestPortState);
  const ioByNode = useAtomValue(ioDefinitionsState);

  const lastRunDataByNode = useAtomValue(lastRunDataByNodeState);
  const selectedProcessPageNodes = useAtomValue(selectedProcessPageNodesState);

  const handleMouseDown = useStableCallback((event: MouseEvent) => {
    const { clientX, clientY } = event;
    setMousePosition({ x: clientX, y: clientY });
  });

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!draggingWire && !draggingNode) {
        return;
      }

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
      } else if (closestPort !== undefined) {
        setClosestPort(undefined);
      }
    },
    [draggingWire, setClosestPort, draggingNode, ioByNode, closestPort],
  );

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, handleMouseDown]);

  useLayoutEffect(() => {}, [draggingWire, mousePosition.x, mousePosition.y, setClosestPort]);

  const { canvasPosition, clientToCanvasPosition, canvasToClientPosition } = useCanvasPositioning();
  const mousePositionCanvas = clientToCanvasPosition(mousePosition.x, mousePosition.y);

  const nodesById = useAtomValue(nodesByIdState);

  // Despite having to run getNodePortPositions in ConditionallyRenderWire, it's still faster to filter here
  // using lineCrossesViewport, especially for gigantic graphs when zoomed in. Avoiding rendering thousands of
  // <ErrorBoundary> and <ConditionallyRenderWire> helps with the performance.
  const renderableWires = useMemo(() => {
    return connections.filter((connection) => {
      const inputNode = nodesById[connection.inputNodeId];
      const outputNode = nodesById[connection.outputNodeId];

      if (!inputNode || !outputNode) {
        return false;
      }

      const [outputCacheKey, inputCacheKey] = getConnectionCacheKeys(connection);

      const start = getNodePortPosition(outputNode, connection.outputId, outputCacheKey, portPositions);
      const end = getNodePortPosition(inputNode, connection.inputId, inputCacheKey, portPositions);

      const startClient = canvasToClientPosition(start.x, start.y);
      const endClient = canvasToClientPosition(end.x, end.y);

      return lineCrossesViewport(startClient, endClient);
    });
  }, [nodesById, canvasToClientPosition, connections, portPositions]);

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
        {renderableWires.map((connection) => {
          const isHighlightedNode =
            highlightedNodes?.includes(connection.inputNodeId) || highlightedNodes?.includes(connection.outputNodeId);

          const isCurrentlyRunning = lastRunDataByNode[connection.inputNodeId]?.some(
            (run) => run.data.status?.type === 'running',
          );

          const isHighlightedPort =
            highlightedPort &&
            (highlightedPort.isInput ? connection.inputId : connection.outputId) === highlightedPort.portId &&
            (highlightedPort.isInput ? connection.inputNodeId : connection.outputNodeId) === highlightedPort.nodeId;

          const isNotRan = getIsNotRan(connection, selectedProcessPageNodes, lastRunDataByNode);

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

// Not sure if too much computation to run on render... it's all indexed lookups, but there are a lot
function getIsNotRan(
  connection: NodeConnection,
  selectedProcessPageNodes: Record<NodeId, number | 'latest'>,
  lastRunDataByNode: RunDataByNodeId,
) {
  // Too heavyweight for here?
  const inputNodeSelectedProcessPage = selectedProcessPageNodes[connection.inputNodeId];
  const outputNodeSelectedProcessPage = selectedProcessPageNodes[connection.outputNodeId];
  const inputNodeLastRunData = lastRunDataByNode[connection.inputNodeId];
  const outputNodeLastRunData = lastRunDataByNode[connection.outputNodeId];
  let isNotRan = false;
  if (
    inputNodeLastRunData &&
    outputNodeLastRunData &&
    inputNodeSelectedProcessPage != null &&
    outputNodeSelectedProcessPage != null &&
    inputNodeSelectedProcessPage === outputNodeSelectedProcessPage // Needs same process selected for this to mean anything
  ) {
    const inputNodeSelectedExecution =
      inputNodeSelectedProcessPage === 'latest'
        ? inputNodeLastRunData[inputNodeLastRunData.length - 1]
        : inputNodeLastRunData[inputNodeSelectedProcessPage];
    const outputNodeSelectedExecution =
      outputNodeSelectedProcessPage === 'latest'
        ? outputNodeLastRunData[outputNodeLastRunData.length - 1]
        : outputNodeLastRunData[outputNodeSelectedProcessPage];

    if (inputNodeSelectedExecution?.data.inputData && outputNodeSelectedExecution?.data.outputData) {
      const inputValue = inputNodeSelectedExecution.data.inputData[connection.inputId];
      const outputValue = outputNodeSelectedExecution.data.outputData[connection.outputId];
      isNotRan = outputValue?.type === 'control-flow-excluded' && inputValue?.type === 'control-flow-excluded';
    }
  }

  return isNotRan;
}
