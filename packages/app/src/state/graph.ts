import { DefaultValue, atom, selector, selectorFamily } from 'recoil';
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
import { recoilPersist } from 'recoil-persist';
import { mapValues } from 'lodash-es';
import { projectState } from './savedGraphs';
import { pluginRefreshCounterState } from './plugins';

const { persistAtom } = recoilPersist({ key: 'graph' });

export const graphState = atom<NodeGraph>({
  key: 'graphState',
  default: emptyNodeGraph(),
  effects: [persistAtom],
});

export const graphMetadataState = selector({
  key: 'graphMetadataState',
  get: ({ get }) => {
    return get(graphState).metadata;
  },
  set: ({ set }, newValue) => {
    set(graphState, (oldValue) => {
      return {
        ...oldValue,
        metadata: newValue instanceof DefaultValue ? emptyNodeGraph().metadata : newValue,
      };
    });
  },
});

export const nodesState = selector({
  key: 'nodesState',
  get: ({ get }) => {
    return get(graphState).nodes;
  },
  set: ({ set }, newValue) => {
    set(graphState, (oldValue) => {
      return {
        ...oldValue,
        nodes: newValue instanceof DefaultValue ? [] : newValue,
      };
    });
  },
});

export const connectionsState = selector({
  key: 'connectionsState',
  get: ({ get }) => {
    return get(graphState).connections;
  },
  set: ({ set }, newValue) => {
    set(graphState, (oldValue) => {
      return {
        ...oldValue,
        connections: newValue instanceof DefaultValue ? [] : newValue,
      };
    });
  },
});

export const nodesByIdState = selector({
  key: 'nodesByIdState',
  get: ({ get }) => {
    return get(nodesState).reduce(
      (acc, node) => {
        acc[node.id] = node;
        return acc;
      },
      {} as Record<NodeId, ChartNode>,
    );
  },
});

export const nodesForConnectionState = selector({
  key: 'nodesForConnectionSelector',
  get: ({ get }) => {
    const nodesById = get(nodesByIdState);
    return get(connectionsState).map((connection) => ({
      inputNode: nodesById[connection.inputNodeId],
      outputNode: nodesById[connection.outputNodeId],
    }));
  },
});

export const connectionsForNodeState = selector({
  key: 'connectionsForNodeSelector',
  get: ({ get }) => {
    return get(connectionsState).reduce(
      (acc, connection) => {
        acc[connection.inputNodeId] ??= [];
        acc[connection.inputNodeId]!.push(connection);

        acc[connection.outputNodeId] ??= [];
        acc[connection.outputNodeId]!.push(connection);
        return acc;
      },
      {} as Record<NodeId, NodeConnection[]>,
    );
  },
});

/** Gets connections attached to a single node */
export const connectionsForSingleNodeState = selectorFamily({
  key: 'connectionsForSingleNodeSelector',
  get:
    (nodeId: NodeId) =>
    ({ get }) => {
      return get(connectionsForNodeState)[nodeId];
    },
});

/** Gets a single node by its ID */
export const nodeByIdState = selectorFamily<ChartNode | undefined, NodeId>({
  key: 'nodeByIdSelector',
  get:
    (nodeId) =>
    ({ get }) => {
      return get(nodesByIdState)[nodeId];
    },
});

/** Node instances by node ID */
export const nodeInstancesState = selector<Record<NodeId, NodeImpl<ChartNode, string> | undefined>>({
  key: 'nodeInstances',
  get: ({ get }) => {
    const nodesById = get(nodesByIdState);
    get(pluginRefreshCounterState);

    return mapValues(nodesById, (node) => {
      try {
        return globalRivetNodeRegistry.createDynamicImpl(node);
      } catch (err) {
        return undefined;
      }
    });
  },
});

/** Gets a single node instance by a node ID */
export const nodeInstanceByIdState = selectorFamily<NodeImpl<ChartNode, string> | undefined, NodeId>({
  key: 'nodeInstanceById',
  get:
    (nodeId) =>
    ({ get }) => {
      return get(nodeInstancesState)?.[nodeId];
    },
});

export const ioDefinitionsState = selector<
  Record<
    NodeId,
    {
      inputDefinitions: NodeInputDefinition[];
      outputDefinitions: NodeOutputDefinition[];
    }
  >
>({
  key: 'ioDefinitions',
  get: ({ get }) => {
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
  },
});

export const ioDefinitionsForNodeState = selectorFamily<
  {
    inputDefinitions: NodeInputDefinition[];
    outputDefinitions: NodeOutputDefinition[];
  },
  NodeId | undefined
>({
  key: 'ioDefinitionsForNode',
  get:
    (nodeId) =>
    ({ get }) => {
      return nodeId ? get(ioDefinitionsState)[nodeId]! : { inputDefinitions: [], outputDefinitions: [] };
    },
});

export const nodeConstructorsState = selector({
  key: 'nodeConstructorsState',
  get: ({ get }) => {
    get(pluginRefreshCounterState);

    return globalRivetNodeRegistry.getNodeConstructors();
  },
});
