import { atom, atomFamily, selector, selectorFamily } from 'recoil';
import {
  type ChartNode,
  type GraphId,
  type NodeId,
  NodeImpl,
  type NodeInputDefinition,
  type PortId,
  type DataType,
} from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';
import { type WireDef } from '../components/WireLayer.js';
import { mapValues } from 'lodash-es';

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

export const lastCanvasPositionByGraphState = atom<Record<GraphId, CanvasPosition | undefined>>({
  key: 'lastCanvasPositionByGraph',
  default: {},
  effects: [persistAtom],
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

export type DraggingWireDef = WireDef & { readonly dataType: DataType | Readonly<DataType[]> };

export const draggingWireState = atom<DraggingWireDef | undefined>({
  key: 'draggingWire',
  default: undefined,
});

export const isDraggingWireState = selector<boolean>({
  key: 'isDraggingWire',
  get: ({ get }) => {
    return get(draggingWireState) !== undefined;
  },
});

export const draggingWireClosestPortState = atom<
  { nodeId: NodeId; portId: PortId; element: HTMLElement; definition: NodeInputDefinition } | undefined
>({
  key: 'draggingWireClosestPort',
  default: undefined,
});

export const graphNavigationStackState = atom<{
  stack: GraphId[];
  index?: number;
}>({
  key: 'graphNavigationStack',
  default: {
    stack: [],
    index: undefined,
  },
});

export const pinnedNodesState = atom<NodeId[]>({
  key: 'pinnedNodes',
  default: [],
});

export const isPinnedState = selectorFamily<boolean, NodeId>({
  key: 'isPinned',
  get:
    (nodeId) =>
    ({ get }) =>
      get(pinnedNodesState).includes(nodeId),
});

export const searchingGraphState = atom({
  key: 'searchingGraph',
  default: {
    searching: false,
    query: '',
  },
});

export const searchMatchingNodeIdsState = atom<NodeId[]>({
  key: 'searchMatchingNodeIds',
  default: [],
});

export const hoveringNodeState = atom<NodeId | undefined>({
  key: 'hoveringNode',
  default: undefined,
});
