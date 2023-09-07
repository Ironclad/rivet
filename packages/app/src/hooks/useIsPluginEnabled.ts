import { BuiltInPluginID } from '@ironclad/rivet-core';
import { useDependsOnPlugins } from './useDependsOnPlugins';

export function useIsPluginEnabled(plugin: BuiltInPluginID): boolean {
  const plugins = useDependsOnPlugins();

  return plugins.some((p) => p.id === plugin);
}
