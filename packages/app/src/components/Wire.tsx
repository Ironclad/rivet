import { FC } from 'react';
import { NodeConnection, NodeId, PortId } from '@ironclad/nodai-core';
import { getNodePortPosition } from './DraggableNode';
import { useRecoilValue } from 'recoil';
import { nodesSelector } from '../state/graph';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useGetNodeIO } from '../hooks/useGetNodeIO';
import clsx from 'clsx';

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
  const { clientToCanvasPosition } = useCanvasPositioning();

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

    start = getNodePortPosition(nodes, connection.nodeId, connection.portId, clientToCanvasPosition, getIO);
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

    start = getNodePortPosition(nodes, connection.outputNodeId, connection.outputId, clientToCanvasPosition, getIO);
    end = getNodePortPosition(nodes, connection.inputNodeId, connection.inputId, clientToCanvasPosition, getIO);
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
