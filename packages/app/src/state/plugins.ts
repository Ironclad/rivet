import { atom } from 'recoil';
import { type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';

export type PluginState = {
  id: string;
  loaded: boolean;
  spec: PluginLoadSpec;
};

export const pluginRefreshCounterState = atom({
  key: 'pluginRefreshCounterState',
  default: 0,
});

export const pluginsState = atom<PluginState[]>({
  key: 'pluginsState',
  default: [],
});
