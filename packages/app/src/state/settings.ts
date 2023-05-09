import { atom } from 'recoil';
import { persistAtom } from './persist';
import { Settings } from '@ironclad/nodai-core';

export const settingsState = atom<Settings>({
  key: 'settings',
  default: {
    openAiKey: '',
    openAiOrganization: '',
  },
  effects_UNSTABLE: [persistAtom],
});
