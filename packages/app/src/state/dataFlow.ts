import { atom, selectorFamily } from 'recoil';
import { GraphId, Inputs, NodeId, Outputs, ProcessId } from '@ironclad/rivet-core';

export type ProcessDataForNode = {
  processId: ProcessId;
  data: NodeRunData;
};

export type RunDataByNodeId = {
  [nodeId: NodeId]: ProcessDataForNode[];
};

export type NodeRunData = {
  startedAt?: number;
  finishedAt?: number;

  status?: { type: 'ok' } | { type: 'error'; error: string } | { type: 'running' } | { type: 'interrupted' };

  inputData?: Inputs;

  outputData?: Outputs;

  splitOutputData?: {
    [index: number]: Outputs;
  };
};

export const lastRunDataByNodeState = atom<RunDataByNodeId>({
  key: 'lastData',
  default: {},
});

export const runningGraphsState = atom<GraphId[]>({
  key: 'runningGraphs',
  default: [],
});

export const lastRunData = selectorFamily<ProcessDataForNode[] | undefined, NodeId>({
  key: 'lastRunData',
  get:
    (nodeId: NodeId) =>
    ({ get }) => {
      return get(lastRunDataByNodeState)[nodeId];
    },
});

export const graphRunningState = atom<boolean>({
  key: 'graphRunning',
  default: false,
});

export const graphPausedState = atom<boolean>({
  key: 'graphPaused',
  default: false,
});

export const selectedProcessPageNodesState = atom<Record<NodeId, number | 'latest'>>({
  key: 'selectedProcessPage',
  default: {},
});

export const selectedProcessPage = selectorFamily<number | 'latest', NodeId>({
  key: 'selectedProcessPage',
  get:
    (nodeId: NodeId) =>
    ({ get }) => {
      return get(selectedProcessPageNodesState)[nodeId] ?? 0;
    },
  set:
    (nodeId: NodeId) =>
    ({ set }, newValue) => {
      set(selectedProcessPageNodesState, (oldValue) => {
        return {
          ...oldValue,
          [nodeId]: newValue,
        };
      });
    },
});
