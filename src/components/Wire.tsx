import { FC } from 'react';
import { ChartNode, NodeConnection, NodeId, PortId } from '../model/NodeBase';
import { getNodePortPosition } from './DraggableNode';
import { createUnknownNodeInstance } from '../model/Nodes';

type WireProps = {
  nodes: ChartNode<string, unknown>[];
  connection: NodeConnection | PartialConnection;
  selected: boolean;
};

export type PartialConnection = {
  nodeId: NodeId;
  portId: PortId;
  toX: number;
  toY: number;
};

export const Wire: FC<WireProps> = ({ nodes, connection, selected }) => {
  let start: { x: number; y: number };
  let end: { x: number; y: number };

  if ('toX' in connection) {
    const node = nodes.find((node) => node.id === connection.nodeId);

    let port = null;
    if (node) {
      const nodeImpl = createUnknownNodeInstance(node);
      port =
        nodeImpl.getOutputDefinitions().find((port) => port.id === connection.portId) ??
        nodeImpl.getInputDefinitions().find((port) => port.id === connection.portId);
    }

    if (!port) {
      return null;
    }

    start = getNodePortPosition(nodes, connection.nodeId, connection.portId);
    end = { x: connection.toX, y: connection.toY };
  } else {
    const outputNode = nodes.find((node) => node.id === connection.outputNodeId);
    const outputPort = outputNode
      ? createUnknownNodeInstance(outputNode)
          .getOutputDefinitions()
          .find((port) => port.id === connection.outputId)
      : null;
    const inputNode = nodes.find((node) => node.id === connection.inputNodeId);
    const inputPort = inputNode
      ? createUnknownNodeInstance(inputNode)
          .getInputDefinitions()
          .find((port) => port.id === connection.inputId)
      : null;

    if (!outputPort || !inputPort) {
      return null;
    }

    start = getNodePortPosition(nodes, connection.outputNodeId, connection.outputId);
    end = getNodePortPosition(nodes, connection.inputNodeId, connection.inputId);
  }

  const deltaX = Math.abs(end.x - start.x);
  const xDir = start.x < end.x ? 1 : -1;
  const curveX1 = start.x + xDir * deltaX * 0.5;
  const curveY1 = start.y;
  const curveX2 = start.x + xDir * deltaX * 0.5;
  const curveY2 = end.y;

  const wirePath = `M${start.x},${start.y} C${curveX1},${curveY1} ${curveX2},${curveY2} ${end.x},${end.y}`;

  return <path className={`wire ${selected ? 'selected' : ''}`} d={wirePath} />;
};
