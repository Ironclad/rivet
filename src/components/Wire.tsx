import { FC } from 'react';
import { NodeConnection, NodeId, PortId } from '../model/NodeBase';
import { getNodePortPosition } from './DraggableNode';
import { createUnknownNodeInstance } from '../model/Nodes';
import { useRecoilValue } from 'recoil';
import { nodesSelector } from '../state/graph';
import { useGetConnectionsForNode } from '../hooks/useGetConnectionsForNode';
import { canvasPositionState } from '../state/graphBuilder';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';

type WireProps = {
  connection: NodeConnection | PartialConnection;
  selected: boolean;
};

export type PartialConnection = {
  nodeId: NodeId;
  portId: PortId;
  toX: number;
  toY: number;
};

export const Wire: FC<WireProps> = ({ connection, selected }) => {
  const nodes = useRecoilValue(nodesSelector);
  const getConnectionsForNode = useGetConnectionsForNode();
  const { clientToCanvasPosition } = useCanvasPositioning();

  let start: { x: number; y: number };
  let end: { x: number; y: number };

  if ('toX' in connection) {
    const node = nodes.find((node) => node.id === connection.nodeId);

    let port = null;
    if (node) {
      const nodeImpl = createUnknownNodeInstance(node);
      port =
        nodeImpl.getOutputDefinitions(getConnectionsForNode(node)).find((port) => port.id === connection.portId) ??
        nodeImpl.getInputDefinitions(getConnectionsForNode(node)).find((port) => port.id === connection.portId);
    }

    if (!port) {
      return null;
    }

    start = getNodePortPosition(
      nodes,
      connection.nodeId,
      connection.portId,
      clientToCanvasPosition,
      getConnectionsForNode,
    );
    end = { x: connection.toX, y: connection.toY };
  } else {
    const outputNode = nodes.find((node) => node.id === connection.outputNodeId);

    const outputPort = outputNode
      ? createUnknownNodeInstance(outputNode)
          .getOutputDefinitions(getConnectionsForNode(outputNode))
          .find((port) => port.id === connection.outputId)
      : null;
    const inputNode = nodes.find((node) => node.id === connection.inputNodeId);
    const inputPort = inputNode
      ? createUnknownNodeInstance(inputNode)
          .getInputDefinitions(getConnectionsForNode(inputNode))
          .find((port) => port.id === connection.inputId)
      : null;

    if (!outputPort || !inputPort) {
      return null;
    }

    start = getNodePortPosition(
      nodes,
      connection.outputNodeId,
      connection.outputId,
      clientToCanvasPosition,
      getConnectionsForNode,
    );
    end = getNodePortPosition(
      nodes,
      connection.inputNodeId,
      connection.inputId,
      clientToCanvasPosition,
      getConnectionsForNode,
    );
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
