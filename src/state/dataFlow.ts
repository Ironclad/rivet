import { atom } from 'recoil';
import { NodeId, PortId } from '../model/NodeBase';

export type RunDataByNodeId = {
  [nodeId: NodeId]: NodeRunData;
};

export type NodeRunData = {
  status?: { status: 'ok' } | { status: 'error'; error: string };

  inputData?: {
    [key: PortId]: unknown;
  };

  outputData?: {
    [key: PortId]: unknown;
  };
};

export const lastRunDataByNodeState = atom<RunDataByNodeId>({
  key: 'lastData',
  default: {},
});
