import { atom } from 'recoil';

export type PluginState = {
  id: string;
  uri: string;
  loaded: boolean;
};

export const pluginsState = atom<PluginState[]>({
  key: 'pluginsState',
  default: [],
});
