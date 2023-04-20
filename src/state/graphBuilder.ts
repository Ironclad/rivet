import { atom } from 'recoil';
import { NodeId } from '../model/NodeBase';

export const selectedNodeState = atom<NodeId | null>({
  key: 'selectedNodeState',
  default: null,
});

export const canvasPositionState = atom<{ x: number; y: number; zoom: number }>({
  key: 'canvasPosition',
  default: { x: 0, y: 0, zoom: 1 },
});
