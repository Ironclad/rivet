import { atom, atomFamily, selector } from 'recoil';
import { ChartNode, GraphId, NodeId, PortId } from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';
import { WireDef } from '../components/WireLayer.js';

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

export const draggingWireState = atom<WireDef | undefined>({
  key: 'draggingWire',
  default: undefined,
});

export const isDraggingWireState = selector<boolean>({
  key: 'isDraggingWire',
  get: ({ get }) => {
    return get(draggingWireState) !== undefined;
  },
});

export const draggingWireClosestPortState = atom<{ nodeId: NodeId; portId: PortId } | undefined>({
  key: 'draggingWireClosestPort',
  default: undefined,
});
