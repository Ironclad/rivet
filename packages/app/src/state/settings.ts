import { atom } from 'recoil';
import { persistAtom } from './persist.js';
import { Settings } from '@ironclad/rivet-core';

export const settingsState = atom<Settings>({
  key: 'settings',
  default: {
    recordingPlaybackLatency: 1000,

    openAiKey: '',
    openAiOrganization: '',

    pluginEnv: {},
    pluginSettings: {},
  },
  effects_UNSTABLE: [persistAtom],
});
