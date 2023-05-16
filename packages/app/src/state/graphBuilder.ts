import { atom, atomFamily } from 'recoil';
import { ChartNode, GraphId, NodeId } from '@ironclad/nodai-core';
import { persistAtom } from './persist';

export const selectedNodeState = atom<NodeId | null>({
  key: 'selectedNodeState',
  default: null,
});

export type CanvasPosition = { x: number; y: number; zoom: number; fromSaved?: boolean };

export const canvasPositionState = atom<CanvasPosition>({
  key: 'canvasPosition',
  default: { x: 0, y: 0, zoom: 1 },
});

export const lastCanvasPositionForGraphState = atomFamily<CanvasPosition | undefined, GraphId>({
  key: 'lastCanvasPositionForGraph',
  default: undefined,
  effects_UNSTABLE: [persistAtom],
});

export const draggingNodeState = atom<ChartNode | null>({
  key: 'draggingNode',
  default: null,
});

export const lastMousePositionState = atom<{ x: number; y: number }>({
  key: 'lastMousePosition',
  default: { x: 0, y: 0 },
});
