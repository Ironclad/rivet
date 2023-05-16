import { atom, selectorFamily } from 'recoil';
import { DataValue, GraphId, NodeId, PortId } from '@ironclad/nodai-core';

export type RunDataByNodeId = {
  [nodeId: NodeId]: NodeRunData;
};

export type NodeRunData = {
  status?: { type: 'ok' } | { type: 'error'; error: string } | { type: 'running' };

  inputData?: {
    [key: PortId]: DataValue;
  };

  outputData?: {
    [key: PortId]: DataValue;
  };

  splitOutputData?: {
    [index: number]: {
      [key: PortId]: DataValue;
    };
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

export const lastRunData = selectorFamily<NodeRunData | undefined, NodeId>({
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
