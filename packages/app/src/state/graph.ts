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
  async (get) => (await get(graphState)).metadata,
  async (get, set, newValue: NodeGraph['metadata']) => {
    const currentGraph = await get(graphState);
    set(graphState, { ...currentGraph, metadata: newValue });
  },
);

export const nodesState = atom(
  async (get) => (await get(graphState)).nodes,
  async (get, set, newValue: ChartNode[] | ((prev: ChartNode[]) => ChartNode[])) => {
    const currentGraph = await get(graphState);
    const currentNodes = currentGraph.nodes;

    const nextNodes = typeof newValue === 'function' ? newValue(currentNodes) : newValue;

    set(graphState, { ...currentGraph, nodes: nextNodes });
  },
);

export const connectionsState = atom(
  async (get) => (await get(graphState)).connections,
  async (get, set, newValue: NodeConnection[] | ((prev: NodeConnection[]) => NodeConnection[])) => {
    const currentGraph = await get(graphState);
    const currentConnections = currentGraph.connections;

    const nextConnections = typeof newValue === 'function' ? newValue(currentConnections) : newValue;

    set(graphState, { ...currentGraph, connections: nextConnections });
  },
);

export const nodesByIdState = atom(async (get) =>
  (await get(nodesState)).reduce(
    (acc, node) => {
      acc[node.id] = node;
      return acc;
    },
    {} as Record<NodeId, ChartNode>,
  ),
);

export const nodesForConnectionState = atom(async (get) => {
  const nodesById = await get(nodesByIdState);
  return (await get(connectionsState)).map((connection) => ({
    inputNode: nodesById[connection.inputNodeId],
    outputNode: nodesById[connection.outputNodeId],
  }));
});

export const connectionsForNodeState = atom(async (get) =>
  (await get(connectionsState)).reduce(
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
  atom(async (get) => (await get(connectionsForNodeState))[nodeId]),
);

export const nodeByIdState = atomFamily((nodeId: NodeId) => atom(async (get) => (await get(nodesByIdState))[nodeId]));

export const nodeInstancesState = atom(async (get) => {
  const nodesById = await get(nodesByIdState);
  get(pluginRefreshCounterState); // Keep dependency

  return mapValues(nodesById, (node) => {
    try {
      return globalRivetNodeRegistry.createDynamicImpl(node);
    } catch (err) {
      return undefined;
    }
  });
});

export const nodeInstanceByIdState = atomFamily((nodeId: NodeId) =>
  atom(async (get) => (await get(nodeInstancesState))?.[nodeId]),
);

export const ioDefinitionsState = atom(async (get) => {
  const nodeInstances = await get(nodeInstancesState);
  const connectionsForNode = await get(connectionsForNodeState);
  const nodesById = await get(nodesByIdState);
  const project = await get(projectState);

  return mapValues(nodesById, (node) => {
    const connections = connectionsForNode[node.id] ?? [];

    const inputDefinitions = nodeInstances[node.id]?.getInputDefinitionsIncludingBuiltIn(
      connections,
      nodesById,
      project,
    );
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
  atom(async (get) =>
    nodeId ? (await get(ioDefinitionsState))[nodeId]! : { inputDefinitions: [], outputDefinitions: [] },
  ),
);

export const nodeConstructorsState = atom((get) => {
  get(pluginRefreshCounterState);
  return globalRivetNodeRegistry.getNodeConstructors();
});
