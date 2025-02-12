import { atom } from 'jotai';
import { atomWithStorage, atomFamily } from 'jotai/utils';
import {
  type ChartNode,
  type GraphId,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type DataType,
  type NodeGraph,
} from '@ironclad/rivet-core';
import { type WireDef } from '../components/WireLayer.js';
import { createHybridStorage } from './storage.js';
import { type SearchedItem, type SearchableItem } from '../hooks/useSearchProject';

const { storage } = createHybridStorage('graphBuilder');

export const viewingNodeChangesState = atom<NodeId | undefined>(undefined);

export const selectedNodesState = atom<NodeId[]>([]);

export const editingNodeState = atom<NodeId | null>(null);

export type CanvasPosition = { x: number; y: number; zoom: number; fromSaved?: boolean };

export const canvasPositionState = atom<CanvasPosition>({
  x: 0,
  y: 0,
  zoom: 1,
});

export const lastCanvasPositionByGraphState = atomWithStorage<Record<GraphId, CanvasPosition | undefined>>(
  'lastCanvasPositionByGraph',
  {},
  storage,
);

export const draggingNodesState = atom<ChartNode[]>([]);

export const lastMousePositionState = atom<{ x: number; y: number }>({
  x: 0,
  y: 0,
});

export const sidebarOpenState = atom<boolean>(true);

export type DraggingWireDef = WireDef & { readonly dataType: DataType | Readonly<DataType[]> };

export const draggingWireState = atom<DraggingWireDef | undefined>(undefined);

export const isDraggingWireState = atom((get) => get(draggingWireState) !== undefined);

export const draggingWireClosestPortState = atom<
  | {
      nodeId: NodeId;
      portId: PortId;
      element: HTMLElement;
      definition: NodeInputDefinition;
    }
  | undefined
>(undefined);

export const graphNavigationStackState = atom<{
  stack: GraphId[];
  index?: number;
}>({
  stack: [],
  index: undefined,
});

export const pinnedNodesState = atom<NodeId[]>([]);

export const isPinnedState = atomFamily((nodeId: NodeId) => atom((get) => get(pinnedNodesState).includes(nodeId)));

export const searchingGraphState = atom({
  searching: false,
  query: '',
});

export const goToSearchState = atom<{
  searching: boolean;
  query: string;
  selectedIndex: number;
  entries: SearchedItem[];
}>({
  searching: false,
  query: '',
  selectedIndex: 0,
  entries: [],
});

export const searchMatchingNodeIdsState = atom<NodeId[]>([]);

export const hoveringNodeState = atom<NodeId | undefined>(undefined);
