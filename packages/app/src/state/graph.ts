import { DefaultValue, atom, selector, selectorFamily } from 'recoil';
import { persistAtom } from './persist';
import { NodeGraph, NodeOfType, NodeType, emptyNodeGraph } from '@ironclad/rivet-core';

export const graphState = atom<NodeGraph>({
  key: 'graphState',
  default: emptyNodeGraph(),
  effects_UNSTABLE: [persistAtom],
});

export const nodesSelector = selector({
  key: 'nodesSelector',
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

export const connectionsSelector = selector({
  key: 'connectionsSelector',
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

export const nodesOfTypeState = selectorFamily({
  key: 'nodesOfTypeState',
  get:
    <T extends NodeType>(type: T) =>
    ({ get }) => {
      return get(nodesSelector).filter((node) => node.type === type) as NodeOfType<T>[];
    },
});
