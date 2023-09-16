import { atom } from 'recoil';
import { persistAtom } from './persist.js';
import { Settings } from '@ironclad/rivet-core';
import { isInTauri } from '../utils/tauri';

export const settingsState = atom<Settings>({
  key: 'settings',
  default: {
    recordingPlaybackLatency: 1000,

    openAiKey: '',
    openAiOrganization: '',
    openAiEndpoint: '',

    pluginEnv: {},
    pluginSettings: {},
  },
  effects_UNSTABLE: [persistAtom],
});

export const themes = [
  {
    label: 'Molten',
    value: 'molten',
  },
  {
    label: 'Grapefruit',
    value: 'grapefruit',
  },
  {
    label: 'Taffy',
    value: 'taffy',
  },
] as const;

export type Theme = (typeof themes)[number]['value'];

export const themeState = atom<Theme>({
  key: 'theme',
  default: 'molten',
  effects_UNSTABLE: [persistAtom],
});

export const recordExecutionsState = atom<boolean>({
  key: 'recordExecutions',
  default: true,
  effects_UNSTABLE: [persistAtom],
});

export const defaultExecutorState = atom<'browser' | 'nodejs'>({
  key: 'defaultExecutor',
  default: 'browser',
  effects_UNSTABLE: [persistAtom],
});

export const executorOptions = isInTauri()
  ? ([
      { label: 'Browser', value: 'browser' },
      { label: 'Node', value: 'nodejs' },
    ] as const)
  : ([{ label: 'Browser', value: 'browser' }] as const);
