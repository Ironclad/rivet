import { atom } from 'recoil';
import { ChartNode, NodeId } from '@ironclad/nodai-core';

export const selectedNodeState = atom<NodeId | null>({
  key: 'selectedNodeState',
  default: null,
});

export const canvasPositionState = atom<{ x: number; y: number; zoom: number }>({
  key: 'canvasPosition',
  default: { x: 0, y: 0, zoom: 1 },
});

export const draggingNodeState = atom<ChartNode | null>({
  key: 'draggingNode',
  default: null,
});

export const lastMousePositionState = atom<{ x: number; y: number }>({
  key: 'lastMousePosition',
  default: { x: 0, y: 0 },
});
