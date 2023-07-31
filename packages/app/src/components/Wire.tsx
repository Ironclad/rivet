import { FC, memo, useMemo } from 'react';
import {
  ChartNode,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  PortId,
} from '@ironclad/rivet-core';
import { useRecoilValue } from 'recoil';
import { nodesByIdState } from '../state/graph.js';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { useGetNodeIO } from '../hooks/useGetNodeIO.js';
import clsx from 'clsx';
import { nodePortPositionCache } from './VisualNode.js';
import { lineCrossesViewport } from '../utils/lineClipping.js';
import { ErrorBoundary } from 'react-error-boundary';

type WireProps = {
  connection: NodeConnection | PartialConnection;
  selected: boolean;
  highlighted: boolean;
};

export type PartialConnection = {
  nodeId: NodeId;
  portId: PortId;
  toX: number;
  toY: number;
};

export function useWireStartEnd(connection: NodeConnection | PartialConnection) {
  const nodesById = useRecoilValue(nodesByIdState);
  const getIO = useGetNodeIO();

  const possibleNodes = 'toX' in connection ? [connection.nodeId] : [connection.inputNodeId, connection.outputNodeId];

  const possibleNodeCachedValues = possibleNodes
    .flatMap((nodeId) => {
      const ports = 'toX' in connection ? [connection.portId] : [connection.inputId, connection.outputId];
      return ports.map((portId) => [nodeId, portId] as const);
    })
    .filter(([nodeId, portId]) => nodeId && portId)
    .map(
      ([nodeId, portId]) =>
        [nodePortPositionCache[nodeId]?.[portId]?.x, nodePortPositionCache[nodeId]?.[portId]?.y] as const,
    )
    .filter(([x, y]) => x && y)
    .map(([x, y]) => `${x},${y}`)
    .join('\n');

  return useMemo(() => {
    let start: { x: number; y: number };
    let end: { x: number; y: number };

    if ('toX' in connection) {
      const node = nodesById[connection.nodeId];

      let port = null;
      if (node) {
        const { inputDefinitions, outputDefinitions } = getIO(node);
        port =
          outputDefinitions.find((port) => port.id === connection.portId) ??
          inputDefinitions.find((port) => port.id === connection.portId);
      }

      if (!port) {
        return null;
      }

      start = getNodePortPosition(nodesById[connection.nodeId]!, connection.portId, getIO);
      end = { x: connection.toX, y: connection.toY };
    } else {
      const outputNode = nodesById[connection.outputNodeId];

      const outputPort = outputNode
        ? getIO(outputNode).outputDefinitions.find((port) => port.id === connection.outputId)
        : null;
      const inputNode = nodesById[connection.inputNodeId];
      const inputPort = inputNode
        ? getIO(inputNode).inputDefinitions.find((port) => port.id === connection.inputId)
        : null;

      if (!outputPort || !inputPort) {
        return null;
      }

      start = getNodePortPosition(nodesById[connection.outputNodeId]!, connection.outputId, getIO);
      end = getNodePortPosition(nodesById[connection.inputNodeId]!, connection.inputId, getIO);
    }

    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesById, connection, getIO, possibleNodeCachedValues]);
}

export const ConditionallyRenderWire: FC<WireProps> = ({ connection, selected, highlighted }) => {
  const startEnd = useWireStartEnd(connection);
  const { canvasToClientPosition } = useCanvasPositioning();

  if (!startEnd) {
    return null;
  }

  const { start, end } = startEnd;

  if (!lineCrossesViewport(canvasToClientPosition(start.x, start.y), canvasToClientPosition(end.x, end.y))) {
    return null;
  }

  return (
    <ErrorBoundary fallback={<></>}>
      <Wire sx={start.x} sy={start.y} ex={end.x} ey={end.y} selected={selected} highlighted={highlighted} />;
    </ErrorBoundary>
  );
};

export const Wire: FC<{
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  selected: boolean;
  highlighted: boolean;
}> = memo(({ sx, sy, ex, ey, selected, highlighted }) => {
  const deltaX = Math.abs(ex - sx);
  const handleDistance = sx <= ex ? deltaX * 0.5 : Math.abs(ey - sy) * 0.6;

  const isBackwards = sx > ex;

  const curveX1 = sx + handleDistance;
  const curveY1 = sy;
  const curveX2 = ex - handleDistance;
  const curveY2 = ey;

  const middleY = (sy + ey) / 2;

  const wirePath =
    sx <= ex
      ? `M${sx},${sy} C${curveX1},${curveY1} ${curveX2},${curveY2} ${ex},${ey}`
      : `M${sx},${sy} C${curveX1},${curveY1} ${curveX1},${middleY} ${sx},${middleY} ` +
        `L${ex},${middleY} C${curveX2},${middleY} ${curveX2},${curveY2} ${ex},${ey}`;

  return <path className={clsx('wire', { selected, highlighted, backwards: isBackwards })} d={wirePath} />;
});

export function getNodePortPosition(
  node: ChartNode,
  portId: PortId,
  getIO: (node: ChartNode) => { inputDefinitions: NodeInputDefinition[]; outputDefinitions: NodeOutputDefinition[] },
): { x: number; y: number } {
  if (!(node && portId)) {
    return { x: 0, y: 0 };
  }

  let isInput = true;
  const io = getIO(node);
  const foundInput = io.inputDefinitions.find((input) => input.id === portId);
  let foundPort: NodeInputDefinition | NodeOutputDefinition | undefined = foundInput;
  if (!foundPort) {
    isInput = false;
    foundPort = io.outputDefinitions.find((output) => output.id === portId);
  }

  if (foundPort) {
    const portPosition = nodePortPositionCache[node.id]?.[foundPort.id];
    if (portPosition) {
      return { x: portPosition.x, y: portPosition.y };
    } else {
      return {
        x: isInput ? node.visualData.x : node.visualData.x + (node.visualData.width ?? 300),
        y: node.visualData.y + 100,
      };
    }
  }

  return { x: 0, y: 0 };
}
