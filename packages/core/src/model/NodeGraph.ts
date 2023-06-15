import { nanoid } from 'nanoid';
import { ChartNode, NodeConnection, NodeId, PortId, SerializedNode } from './NodeBase';
import { Opaque } from 'type-fest';
import { DataValue } from '../model/DataValue';

export type GraphId = Opaque<string, 'GraphId'>;
export type GraphTestId = Opaque<string, 'GraphTestId'>;

export interface NodeGraph {
  metadata?: {
    id?: GraphId;
    name?: string;
    description?: string;
  };
  testCases?: NodeGraphTest[];

  nodes: ChartNode[];
  connections: NodeConnection[];
}

export interface SerializedGraph {
  metadata: {
    id: GraphId;
    name: string;
    description: string;
  };

  nodes: Record<NodeId, SerializedNode>;

  testCases?: NodeGraphTest[];
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

export interface NodeGraphTest {
  id: GraphTestId;
  name: string;
  description?: string;
  testInputs: NodeGraphTestInputData[]; // Store perturbations of inputs.
  testValidations: NodeGraphTestValidation[]; // List of validations.
}

export interface NodeGraphTestInputData {
  inputs: Record<string, DataValue>;
}

export interface NodeGraphTestValidation {
  description: string;
  outputId: PortId;
  evaluatorGraphId: GraphId;
}

export function emptyNodeGraphTest(): NodeGraphTest {
  return {
    id: nanoid() as GraphTestId,
    name: 'Untitled Test',
    testInputs: [],
    testValidations: [],
  };
}
