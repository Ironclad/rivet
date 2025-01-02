import { pluginRefreshCounterState } from '../state/plugins';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useAtomValue } from 'jotai';

export function useDependsOnPlugins() {
  useAtomValue(pluginRefreshCounterState);

  return globalRivetNodeRegistry.getPlugins();
}
