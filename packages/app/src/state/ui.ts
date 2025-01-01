import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const debuggerPanelOpenState = atom<boolean>(false);

export type OverlayKey = 'promptDesigner' | 'trivet' | 'chatViewer' | 'dataStudio' | 'plugins' | 'community';

export const overlayOpenState = atom<OverlayKey | undefined>(undefined);

export const newProjectModalOpenState = atom<boolean>(false);

export const expandedFoldersState = atomWithStorage<Record<string, boolean>>('ui-expanded-folders', {});

export const helpModalOpenState = atom<boolean>(false);
