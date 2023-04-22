import { atom, selectorFamily } from 'recoil';
import { NodeId, PortId } from '../model/NodeBase';
import { DataValue } from '../model/DataValue';

export type RunDataByNodeId = {
  [nodeId: NodeId]: NodeRunData;
};

export type NodeRunData = {
  status?: { status: 'ok' } | { status: 'error'; error: string };

  inputData?: {
    [key: PortId]: DataValue;
  };

  outputData?: {
    [key: PortId]: DataValue;
  };
};

export const lastRunDataByNodeState = atom<RunDataByNodeId>({
  key: 'lastData',
  default: {},
});

export const lastRunData = selectorFamily<NodeRunData | undefined, NodeId>({
  key: 'lastRunData',
  get:
    (nodeId: NodeId) =>
    ({ get }) => {
      return get(lastRunDataByNodeState)[nodeId];
    },
});
