import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
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
    value: P extends 'binary' | 'audio' | 'image' | 'document' | 'chat-message'
      ? { ref: string }
      : Extract<DataValue, { type: P }>['value'];
  };
}[DataType];

export type PageValue = number | 'latest';

export type PageUpdater = (prev: PageValue) => PageValue;

export type ScalarDataValueWithRefs = Extract<DataValueWithRefs, { type: ScalarDataType }>;

export const lastRunDataByNodeState = atom<RunDataByNodeId>({});

export const lastRunDataState = atomFamily((nodeId: NodeId) => atom((get) => get(lastRunDataByNodeState)[nodeId]));

export const runningGraphsState = atom<GraphId[]>([]);

export const rootGraphState = atom<GraphId | undefined>(undefined);

export const graphRunningState = atom(false);

export const graphStartTimeState = atom<number | undefined>(undefined);

export const graphPausedState = atom(false);

export const selectedProcessPageNodesState = atom<Record<NodeId, PageValue>>({});

export const selectedProcessPageState = atomFamily((nodeId: NodeId) =>
  atom(
    (get) => get(selectedProcessPageNodesState)[nodeId] ?? 0,
    (get, set, newValue: PageValue | PageUpdater) => {
      set(selectedProcessPageNodesState, (oldValue) => {
        const currentValue = oldValue[nodeId] ?? 0;
        const nextValue = typeof newValue === 'function' ? (newValue as PageUpdater)(currentValue) : newValue;

        return {
          ...oldValue,
          [nodeId]: nextValue,
        };
      });
    },
  ),
);
