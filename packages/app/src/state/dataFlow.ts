import { atom, selectorFamily } from 'recoil';
import {
  type PortId,
  type GraphId,
  type Inputs,
  type NodeId,
  type Outputs,
  type ProcessId,
  type DataType,
  type DataValue,
  type ScalarDataType,
} from '@ironclad/rivet-core';

export type ProcessDataForNode = {
  processId: ProcessId;
  data: NodeRunDataWithRefs;
};

export type RunDataByNodeId = {
  [nodeId: NodeId]: ProcessDataForNode[];
};

export type NodeRunDataBase = {
  startedAt?: number;
  finishedAt?: number;

  status?:
    | { type: 'ok' }
    | { type: 'error'; error: string }
    | { type: 'running' }
    | { type: 'interrupted' }
    | { type: 'notRan'; reason: string };
};

export type NodeRunData = NodeRunDataBase & {
  inputData?: Inputs;

  outputData?: Outputs;

  splitOutputData?: {
    [index: number]: Outputs;
  };
};

export type NodeRunDataWithRefs = NodeRunDataBase & {
  inputData?: InputsOrOutputsWithRefs;

  outputData?: InputsOrOutputsWithRefs;

  splitOutputData?: {
    [index: number]: InputsOrOutputsWithRefs;
  };
};

export type InputsOrOutputsWithRefs = {
  [portId: PortId]: DataValueWithRefs;
};

export type DataValueWithRefs = {
  [P in DataType]: {
    type: P;
    value: P extends 'binary' | 'audio' | 'image' ? { ref: string } : Extract<DataValue, { type: P }>['value'];
  };
}[DataType];

export type ScalarDataValueWithRefs = Extract<DataValueWithRefs, { type: ScalarDataType }>;

export const lastRunDataByNodeState = atom<RunDataByNodeId>({
  key: 'lastData',
  default: {},
});

export const runningGraphsState = atom<GraphId[]>({
  key: 'runningGraphs',
  default: [],
});

export const rootGraphState = atom<GraphId | undefined>({
  key: 'rootGraph',
  default: undefined,
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

export const graphStartTimeState = atom<number | undefined>({
  key: 'graphStartTime',
  default: undefined,
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
