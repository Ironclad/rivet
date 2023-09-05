import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import { useEffect } from 'react';
import { globalRivetNodeRegistry, resetGlobalRivetNodeRegistry } from '@ironclad/rivet-core';
import { RivetPlugin } from '../../../core/src/model/RivetPlugin';
import { pluginRefreshCounterState, pluginsState } from '../state/plugins';
import { produce } from 'immer';
import { match } from 'ts-pattern';
import { plugins as rivetPlugins } from '@ironclad/rivet-core';
import { useBuiltInPlugins } from './useBuiltInPlugins';
import { isNotNull } from '../utils/genericUtilFunctions';
import { getError } from '../utils/errors';

export function useProjectPlugins() {
  const pluginSpecs = useRecoilValue(projectPluginsState);
  const [plugins, setPlugins] = useRecoilState(pluginsState);
  const setPluginRefreshCounter = useSetRecoilState(pluginRefreshCounterState);

  useEffect(() => {
    resetGlobalRivetNodeRegistry();

    setPlugins(pluginSpecs.map((spec) => ({ id: spec.id, spec, loaded: false })));

    (async () => {
      const plugins = await Promise.all(
        pluginSpecs.map(async (spec) => {
          try {
            const loadedPlugin = await match(spec)
              .with({ type: 'built-in' }, async (spec) => {
                const { name } = spec;
                if (name in rivetPlugins) {
                  return rivetPlugins[name as keyof typeof rivetPlugins];
                }
                throw new Error(`Unknown built-in plugin ${name}.`);
              })
              .with({ type: 'uri' }, async (spec) => {
                const plugin = ((await import(spec.uri)) as { default: RivetPlugin }).default;
                if (!plugin?.id) {
                  throw new Error(`Plugin ${spec.id} does not have an id`);
                }
                return plugin;
              })
              .exhaustive();

            setPlugins((oldPlugins) =>
              produce(oldPlugins, (draft) => {
                const plugin = draft.find((plugin) => plugin.id === spec.id);
                if (plugin) {
                  plugin.loaded = true;
                }
              }),
            );

            return loadedPlugin;
          } catch (err) {
            console.error(`Failed to load plugin ${spec.id}: ${getError(err).message}`);
            return null;
          }
        }),
      );

      for (const plugin of plugins.filter(isNotNull)) {
        globalRivetNodeRegistry.registerPlugin(plugin);
        console.log(`Loaded plugin: ${plugin.id}`);
      }

      setPluginRefreshCounter((oldValue) => oldValue + 1);
    })();
  }, [pluginSpecs]);
}
