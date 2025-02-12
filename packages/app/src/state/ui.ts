import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { createHybridStorage } from './storage.js';

const { storage } = createHybridStorage('ui');

export const debuggerPanelOpenState = atom<boolean>(false);

export type OverlayKey = 'promptDesigner' | 'trivet' | 'chatViewer' | 'dataStudio' | 'plugins' | 'community';

export const overlayOpenState = atom<OverlayKey | undefined>(undefined);

export const newProjectModalOpenState = atom<boolean>(false);

export const expandedFoldersState = atomWithStorage<Record<string, boolean>>('expandedFoldersState', {}, storage);

export const helpModalOpenState = atom<boolean>(false);
