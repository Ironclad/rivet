import { atom } from 'recoil';

export const debuggerPanelOpenState = atom({
  key: 'debuggerPanelOpenState',
  default: false,
});

export type OverlayKey = 'promptDesigner' | 'trivet' | 'chatViewer';

export const overlayOpenState = atom<OverlayKey | undefined>({
  key: 'overlayOpenState',
  default: undefined,
});
