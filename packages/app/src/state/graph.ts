import { DefaultValue, atom, selector } from 'recoil';
import { persistAtom } from './persist';
import { NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';

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
