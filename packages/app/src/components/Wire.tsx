import { type FC, memo } from 'react';
import { type ChartNode, type NodeConnection, type NodeId, type PortId } from '@ironclad/rivet-core';
import { useRecoilValue } from 'recoil';
import clsx from 'clsx';
import { ErrorBoundary } from 'react-error-boundary';
import { nodeByIdState } from '../state/graph';
import { type PortPositions } from './NodeCanvas';

type WireProps = {
  connection: NodeConnection;
  selected: boolean;
  highlighted: boolean;
  isNotRan: boolean;
  nodesById: Record<NodeId, ChartNode>;
  portPositions: PortPositions;
};

export type PartialConnection = {
  nodeId: NodeId;
  portId: PortId;
  toX: number;
  toY: number;
};

export const ConditionallyRenderWire: FC<WireProps> = ({
  connection,
  selected,
  highlighted,
  isNotRan,
  nodesById,
  portPositions,
}) => {
  const inputNode = nodesById[connection.inputNodeId]!;
  const outputNode = nodesById[connection.outputNodeId]!;

  if (!inputNode || !outputNode) {
    return null;
  }

  const start = getNodePortPosition(outputNode, connection.outputId, false, portPositions);
  const end = getNodePortPosition(inputNode, connection.inputId, true, portPositions);

  // Optimization might not be needed
  // if (!lineCrossesViewport(canvasToClientPosition(start.x, start.y), canvasToClientPosition(end.x, end.y))) {
  //   return null;
  // }

  return (
    <ErrorBoundary fallback={<></>}>
      <Wire
        sx={start.x}
        sy={start.y}
        ex={end.x}
        ey={end.y}
        selected={selected}
        highlighted={highlighted}
        isNotRan={isNotRan}
      />
      ;
    </ErrorBoundary>
  );
};

export const PartialWire: FC<{ connection: PartialConnection; portPositions: PortPositions }> = ({
  connection,
  portPositions,
}) => {
  const node = useRecoilValue(nodeByIdState(connection.nodeId));

  if (!node) {
    return null;
  }

  const start = getNodePortPosition(node, connection.portId, false, portPositions);
  const end = { x: connection.toX, y: connection.toY };

  return (
    <ErrorBoundary fallback={<></>}>
      <Wire sx={start.x} sy={start.y} ex={end.x} ey={end.y} selected={false} highlighted={false} isNotRan={false} />;
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
  isNotRan: boolean;
}> = memo(({ sx, sy, ex, ey, selected, highlighted, isNotRan }) => {
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

  return <path className={clsx('wire', { selected, highlighted, backwards: isBackwards, isNotRan })} d={wirePath} />;
});

Wire.displayName = 'Wire';

export function getNodePortPosition(
  node: ChartNode,
  portId: PortId,
  portIsInput: boolean,
  portPositions: PortPositions,
): { x: number; y: number } {
  if (!node) {
    return { x: 0, y: 0 };
  }

  if (portId) {
    const key = `${node.id}-${portIsInput ? 'input' : 'output'}-${portId}`;
    const portPosition = portPositions[key];
    if (portPosition) {
      return { x: portPosition.x, y: portPosition.y };
    } else {
      return {
        x: node.visualData.x + 100,
        y: node.visualData.y + 100,
      };
    }
  }

  return { x: 0, y: 0 };
}
