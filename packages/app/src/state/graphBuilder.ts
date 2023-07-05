import { atom, atomFamily } from 'recoil';
import { ChartNode, GraphId, NodeId } from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'graphBuilder' });

export const selectedNodesState = atom<NodeId[]>({
  key: 'selectedNodeState',
  default: [],
});

export const editingNodeState = atom<NodeId | null>({
  key: 'editingNodeState',
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

export const draggingNodesState = atom<ChartNode[]>({
  key: 'draggingNode',
  default: [],
});

export const lastMousePositionState = atom<{ x: number; y: number }>({
  key: 'lastMousePosition',
  default: { x: 0, y: 0 },
});

export const sidebarOpenState = atom<boolean>({
  key: 'sidebarOpen',
  default: true,
});
