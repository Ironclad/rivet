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
}

export function emptyNodeGraph(): NodeGraph {
  return {
    nodes: [],
    connections: [],
    metadata: {
      id: nanoid() as GraphId,
      name: 'Untitled Graph',
      description: '',
    },
  };
}
