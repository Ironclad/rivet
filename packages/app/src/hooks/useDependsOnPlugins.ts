import { useRecoilValue } from 'recoil';
import { pluginRefreshCounterState } from '../state/plugins';

export function useDependsOnPlugins() {
  useRecoilValue(pluginRefreshCounterState);
}
