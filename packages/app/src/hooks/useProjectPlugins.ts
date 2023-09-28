import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import { useEffect } from 'react';
import { globalRivetNodeRegistry, resetGlobalRivetNodeRegistry } from '@ironclad/rivet-core';
import { pluginRefreshCounterState, pluginsState } from '../state/plugins';
import { produce } from 'immer';
import { match } from 'ts-pattern';
import { plugins as rivetPlugins } from '@ironclad/rivet-core';
import { isNotNull } from '../utils/genericUtilFunctions';
import { getError } from '../utils/errors';
import * as Rivet from '@ironclad/rivet-core';
import { useLoadPackagePlugin } from './useLoadPackagePlugin';

export function useProjectPlugins() {
  const pluginSpecs = useRecoilValue(projectPluginsState);
  const [plugins, setPlugins] = useRecoilState(pluginsState);
  const setPluginRefreshCounter = useSetRecoilState(pluginRefreshCounterState);
  const loadPackagePlugin = useLoadPackagePlugin();

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
                const plugin = ((await import(spec.uri)) as { default: Rivet.RivetPluginInitializer }).default;

                if (typeof plugin !== 'function') {
                  throw new Error(`Plugin ${spec.id} is not a function`);
                }

                const initializedPlugin = plugin(Rivet);

                if (!initializedPlugin?.id) {
                  throw new Error(`Plugin ${spec.id} does not have an id`);
                }
                return initializedPlugin;
              })
              .with({ type: 'package' }, async (spec) => {
                const plugin = await loadPackagePlugin(spec);

                if (!plugin?.id) {
                  throw new Error(`Plugin ${spec.package} does not have an id`);
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
