import { atom } from 'jotai';
import { type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';

export type PluginState = {
  id: string;
  loaded: boolean;
  spec: PluginLoadSpec;
};

export const pluginRefreshCounterState = atom<number>(0);

export const pluginsState = atom<PluginState[]>([]);
