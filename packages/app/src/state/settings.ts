import { atom } from 'recoil';
import { persistAtom } from './persist';

export interface Settings {
  openAiKey: string;
  openAiOrganization: string;
}

export const settingsState = atom<Settings>({
  key: 'settings',
  default: {
    openAiKey: '',
    openAiOrganization: '',
  },
  effects_UNSTABLE: [persistAtom],
});
