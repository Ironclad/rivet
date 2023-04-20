import { atom } from 'recoil';
import { NodeId } from '../model/NodeBase';

export const selectedNodeState = atom<NodeId | null>({
  key: 'selectedNodeState',
  default: null,
});
