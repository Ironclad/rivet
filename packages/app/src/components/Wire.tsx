import { FC } from 'react';
import {
  ChartNode,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  PortId,
} from '@ironclad/nodai-core';
import { useRecoilValue } from 'recoil';
import { nodesSelector } from '../state/graph';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useGetNodeIO } from '../hooks/useGetNodeIO';
import clsx from 'clsx';
import { nodePortCache, nodePortPositionCache } from './VisualNode';
import { useViewportBounds } from '../hooks/useViewportBounds';
import { lineCrossesViewport } from '../utils/lineClipping';

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

export const Wire: FC<WireProps> = ({ connection, selected, highlighted }) => {
  const nodes = useRecoilValue(nodesSelector);
  const getIO = useGetNodeIO();
  const { canvasToClientPosition } = useCanvasPositioning();

  let start: { x: number; y: number };
  let end: { x: number; y: number };

  if ('toX' in connection) {
    const node = nodes.find((node) => node.id === connection.nodeId);

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

    start = getNodePortPosition(nodes, connection.nodeId, connection.portId, canvasToClientPosition, getIO);
    end = { x: connection.toX, y: connection.toY };
  } else {
    const outputNode = nodes.find((node) => node.id === connection.outputNodeId);

    const outputPort = outputNode
      ? getIO(outputNode).outputDefinitions.find((port) => port.id === connection.outputId)
      : null;
    const inputNode = nodes.find((node) => node.id === connection.inputNodeId);
    const inputPort = inputNode
      ? getIO(inputNode).inputDefinitions.find((port) => port.id === connection.inputId)
      : null;

    if (!outputPort || !inputPort) {
      return null;
    }

    start = getNodePortPosition(nodes, connection.outputNodeId, connection.outputId, canvasToClientPosition, getIO);
    end = getNodePortPosition(nodes, connection.inputNodeId, connection.inputId, canvasToClientPosition, getIO);
  }

  if (!lineCrossesViewport({ x: start.x, y: start.y }, { x: end.x, y: end.y })) {
    return null;
  }

  const deltaX = Math.abs(end.x - start.x);
  const handleDistance = start.x <= end.x ? deltaX * 0.5 : Math.abs(end.y - start.y) * 0.6;

  const curveX1 = start.x + handleDistance;
  const curveY1 = start.y;
  const curveX2 = end.x - handleDistance;
  const curveY2 = end.y;

  const middleY = (start.y + end.y) / 2;

  const wirePath =
    start.x <= end.x
      ? `M${start.x},${start.y} C${curveX1},${curveY1} ${curveX2},${curveY2} ${end.x},${end.y}`
      : `M${start.x},${start.y} C${curveX1},${curveY1} ${curveX1},${middleY} ${start.x},${middleY} ` +
        `L${end.x},${middleY} C${curveX2},${middleY} ${curveX2},${curveY2} ${end.x},${end.y}`;

  return <path className={clsx('wire', { selected, highlighted })} d={wirePath} />;
};

export function getNodePortPosition(
  nodes: ChartNode[],
  nodeId: NodeId,
  portId: PortId,
  canvasToClientPosition: (canvasX: number, canvasY: number) => { x: number; y: number },
  getIO: (node: ChartNode) => { inputDefinitions: NodeInputDefinition[]; outputDefinitions: NodeOutputDefinition[] },
): { x: number; y: number } {
  const node = nodes.find((node) => node.id === nodeId);
  if (node && portId) {
    let isInput = true;
    const foundInput = getIO(node).inputDefinitions.find((input) => input.id === portId);
    let foundPort: NodeInputDefinition | NodeOutputDefinition | undefined = foundInput;
    if (!foundPort) {
      isInput = false;
      foundPort = getIO(node).outputDefinitions.find((output) => output.id === portId);
    }

    if (foundPort) {
      const portPosition = nodePortPositionCache[node.id]?.[foundPort.id];
      if (portPosition) {
        const clientPosition = canvasToClientPosition(portPosition.x, portPosition.y);
        return { x: clientPosition.x, y: clientPosition.y };
      } else {
        // Estimate the position of the port since the node is offscreen
        const { x, y } = canvasToClientPosition(
          isInput ? node.visualData.x : node.visualData.x + (node.visualData.width ?? 300),
          node.visualData.y + 100,
        );
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}
