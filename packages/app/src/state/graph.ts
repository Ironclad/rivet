import { atom } from 'jotai';
import { atomWithStorage, atomFamily } from 'jotai/utils';
import {
  type ChartNode,
  type NodeConnection,
  type NodeGraph,
  type NodeId,
  type NodeImpl,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  emptyNodeGraph,
  globalRivetNodeRegistry,
} from '@ironclad/rivet-core';
import { mapValues } from 'lodash-es';
import { projectState } from './savedGraphs';
import { pluginRefreshCounterState } from './plugins';
import { type CalculatedRevision } from '../utils/ProjectRevisionCalculator';
import { createStorage } from './storage.js';

const storage = createStorage('graph');

// Basic atoms
export const historicalGraphState = atom<CalculatedRevision | null>(null);
export const isReadOnlyGraphState = atom<boolean>(false);
export const historicalChangedNodesState = atom<Set<NodeId>>(new Set<NodeId>());

export const graphState = atomWithStorage<NodeGraph>('graphState', emptyNodeGraph(), storage);

// Derived atoms
export const graphMetadataState = atom(
  (get) => get(graphState).metadata,
  (get, set, newValue: NodeGraph['metadata']) => {
    const currentGraph = get(graphState);
    set(graphState, { ...currentGraph, metadata: newValue });
  },
);

export const nodesState = atom(
  (get) => get(graphState).nodes,
  (get, set, newValue: ChartNode[]) => {
    const currentGraph = get(graphState);
    set(graphState, { ...currentGraph, nodes: newValue });
  },
);

export const connectionsState = atom(
  (get) => get(graphState).connections,
  (get, set, newValue: NodeConnection[]) => {
    const currentGraph = get(graphState);
    set(graphState, { ...currentGraph, connections: newValue });
  },
);

export const nodesByIdState = atom((get) =>
  get(nodesState).reduce(
    (acc, node) => {
      acc[node.id] = node;
      return acc;
    },
    {} as Record<NodeId, ChartNode>,
  ),
);

export const nodesForConnectionState = atom((get) => {
  const nodesById = get(nodesByIdState);
  return get(connectionsState).map((connection) => ({
    inputNode: nodesById[connection.inputNodeId],
    outputNode: nodesById[connection.outputNodeId],
  }));
});

export const connectionsForNodeState = atom((get) =>
  get(connectionsState).reduce(
    (acc, connection) => {
      acc[connection.inputNodeId] ??= [];
      acc[connection.inputNodeId]!.push(connection);

      acc[connection.outputNodeId] ??= [];
      acc[connection.outputNodeId]!.push(connection);
      return acc;
    },
    {} as Record<NodeId, NodeConnection[]>,
  ),
);

export const connectionsForSingleNodeState = atomFamily((nodeId: NodeId) =>
  atom((get) => get(connectionsForNodeState)[nodeId]),
);

export const nodeByIdState = atomFamily((nodeId: NodeId) => atom((get) => get(nodesByIdState)[nodeId]));

export const nodeInstancesState = atom((get) => {
  const nodesById = get(nodesByIdState);
  get(pluginRefreshCounterState); // Keep dependency

  return mapValues(nodesById, (node) => {
    try {
      return globalRivetNodeRegistry.createDynamicImpl(node);
    } catch (err) {
      return undefined;
    }
  });
});

export const nodeInstanceByIdState = atomFamily((nodeId: NodeId) => atom((get) => get(nodeInstancesState)?.[nodeId]));

export const ioDefinitionsState = atom((get) => {
  const nodeInstances = get(nodeInstancesState);
  const connectionsForNode = get(connectionsForNodeState);
  const nodesById = get(nodesByIdState);
  const project = get(projectState);

  return mapValues(nodesById, (node) => {
    const connections = connectionsForNode[node.id] ?? [];

    const inputDefinitions = nodeInstances[node.id]?.getInputDefinitions(connections, nodesById, project);
    const outputDefinitions = nodeInstances[node.id]?.getOutputDefinitions(connections, nodesById, project);

    return inputDefinitions && outputDefinitions
      ? {
          inputDefinitions,
          outputDefinitions,
        }
      : { inputDefinitions: [], outputDefinitions: [] };
  });
});

export const ioDefinitionsForNodeState = atomFamily((nodeId: NodeId | undefined) =>
  atom((get) => (nodeId ? get(ioDefinitionsState)[nodeId]! : { inputDefinitions: [], outputDefinitions: [] })),
);

export const nodeConstructorsState = atom((get) => {
  get(pluginRefreshCounterState);
  return globalRivetNodeRegistry.getNodeConstructors();
});
