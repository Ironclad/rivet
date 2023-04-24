import { nanoid } from 'nanoid';
import { ChartNode, NodeConnection, NodeId, PortId } from './NodeBase';
import { Opaque } from 'type-fest';

export type GraphId = Opaque<string, 'GraphId'>;

export interface NodeGraph {
  metadata?: {
    id?: GraphId;
    name?: string;
    description?: string;
  };

  nodes: ChartNode[];
  connections: NodeConnection[];

  nodesById: Record<NodeId, ChartNode>;
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
    metadata: {
      id: nanoid() as GraphId,
      name: 'Untitled Graph',
      description: '',
    },
  };
}

export function calculateCachesFor(graph: NodeGraph): void {
  graph.nodesById = graph.nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {} as Record<NodeId, ChartNode>);

  graph.connectionsByNodeId = graph.connections.reduce((acc, connection) => {
    if (!acc[connection.inputNodeId]) {
      acc[connection.inputNodeId] = [];
    }
    acc[connection.inputNodeId]!.push(connection);
    return acc;
  }, {} as Record<NodeId, NodeConnection[]>);

  graph.connectionsById = graph.connections.reduce((acc, connection) => {
    acc[`${connection.inputNodeId}-${connection.inputId}`] = connection;
    return acc;
  }, {} as Record<`${NodeId}-${PortId}`, NodeConnection>);
}
