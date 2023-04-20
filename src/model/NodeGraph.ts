import { ChartNode, NodeConnection, NodeId, PortId } from './NodeBase';

export interface NodeGraph {
  nodes: ChartNode<string, unknown>[];
  connections: NodeConnection[];

  nodesById: Record<NodeId, ChartNode<string, unknown>>;
  connectionsByNodeId: Record<NodeId, NodeConnection[]>;
  connectionsById: Record<`${NodeId}-${PortId}`, NodeConnection>;
}

export function emptyNodeGraph(): NodeGraph {
  return {
    nodes: [],
    connections: [],
    nodesById: {},
    connectionsByNodeId: {},
    connectionsById: {},
  };
}

export function calculateCachesFor(graph: NodeGraph): void {
  graph.nodesById = graph.nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<NodeId, ChartNode<string, unknown>>);

  graph.connectionsByNodeId = graph.connections.reduce((acc, connection) => {
    if (!acc[connection.inputNodeId]) {
      acc[connection.inputNodeId] = [];
    }
    acc[connection.inputNodeId].push(connection);
    return acc;
  }, {} as Record<NodeId, NodeConnection[]>);

  graph.connectionsById = graph.connections.reduce((acc, connection) => {
    acc[`${connection.inputNodeId}-${connection.inputId}`] = connection;
    return acc;
  }, {} as Record<`${NodeId}-${PortId}`, NodeConnection>);
}
