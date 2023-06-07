import { atom } from 'recoil';
import { persistAtom } from './persist';
import { Settings } from '@ironclad/rivet-core';

export const settingsState = atom<Settings>({
  key: 'settings',
  default: {
    openAiKey: '',
    openAiOrganization: '',
  },
  effects_UNSTABLE: [persistAtom],
});
