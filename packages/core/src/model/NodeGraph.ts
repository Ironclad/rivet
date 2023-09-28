import { nanoid } from 'nanoid/non-secure';
import { type ChartNode, type NodeConnection } from './NodeBase.js';
import type { Opaque } from 'type-fest';
import { type AttachedData } from '../utils/serialization/serializationUtils.js';

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
