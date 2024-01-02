import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({
  key: 'ui',
});

export const debuggerPanelOpenState = atom({
  key: 'debuggerPanelOpenState',
  default: false,
});

export type OverlayKey = 'promptDesigner' | 'trivet' | 'chatViewer' | 'dataStudio' | 'plugins' | 'community';

export const overlayOpenState = atom<OverlayKey | undefined>({
  key: 'overlayOpenState',
  default: undefined,
});

export const newProjectModalOpenState = atom({
  key: 'newProjectModalOpenState',
  default: false,
});

export const expandedFoldersState = atom<Record<string, boolean>>({
  key: 'expandedFoldersState',
  default: {},
  effects: [persistAtom],
});

export const helpModalOpenState = atom<boolean>({
  key: 'helpModalOpenState',
  default: false,
});
