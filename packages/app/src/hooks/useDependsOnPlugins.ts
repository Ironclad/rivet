import { useRecoilValue } from 'recoil';
import { pluginRefreshCounterState } from '../state/plugins';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';

export function useDependsOnPlugins() {
  useRecoilValue(pluginRefreshCounterState);

  return globalRivetNodeRegistry.getPlugins();
}
