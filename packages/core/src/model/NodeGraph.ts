import { nanoid } from 'nanoid';
import { ChartNode, NodeConnection } from './NodeBase.js';
import { Opaque } from 'type-fest';
import { AttachedData } from '../utils/serialization/serializationUtils.js';

export type GraphId = Opaque<string, 'GraphId'>;

export interface NodeGraph {
  metadata?: {
    id?: GraphId;
    name?: string;
    description?: string;

    attachedData?: AttachedData;
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
