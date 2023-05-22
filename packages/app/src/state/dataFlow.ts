import { atom, selectorFamily } from 'recoil';
import { DataValue, GraphId, Inputs, NodeId, Outputs, PortId } from '@ironclad/nodai-core';

export type RunDataByNodeId = {
  [nodeId: NodeId]: NodeRunData;
};

export type NodeRunData = {
  status?: { type: 'ok' } | { type: 'error'; error: string } | { type: 'running' };

  inputData?: Inputs;

  outputData?: Outputs;

  splitOutputData?: {
    [index: number]: {
      [key: PortId]: DataValue | undefined;
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
