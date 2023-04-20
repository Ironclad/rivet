import { NodeGraph, emptyNodeGraph } from '../model/NodeGraph';
import { DefaultValue, atom, selector } from 'recoil';

export const graphState = atom<NodeGraph>({
  key: 'graphState',
  default: emptyNodeGraph(),
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
