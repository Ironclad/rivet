import { type NodeConnection, type ChartNode } from '@ironclad/rivet-core';
import { atom } from 'recoil';

export type NodesClipboardItem = {
  type: 'nodes';
  nodes: ChartNode[];
  connections: NodeConnection[];
};

export type ClipboardItem = NodesClipboardItem;

export const clipboardState = atom<ClipboardItem | undefined>({
  key: 'clipboard',
  default: undefined,
});
