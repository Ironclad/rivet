import { DefaultValue, atom, selector } from 'recoil';
import { ChartNode, NodeConnection, NodeGraph, NodeId, emptyNodeGraph } from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'graph' });

export const graphState = atom<NodeGraph>({
  key: 'graphState',
  default: emptyNodeGraph(),
  effects_UNSTABLE: [persistAtom],
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
    return get(nodesState).reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<NodeId, ChartNode>);
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
    return get(connectionsState).reduce((acc, connection) => {
      acc[connection.inputNodeId] ??= [];
      acc[connection.inputNodeId]!.push(connection);

      acc[connection.outputNodeId] ??= [];
      acc[connection.outputNodeId]!.push(connection);
      return acc;
    }, {} as Record<NodeId, NodeConnection[]>);
  },
});
