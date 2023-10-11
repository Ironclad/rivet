import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import { globalRivetNodeRegistry, resetGlobalRivetNodeRegistry, plugins as rivetPlugins } from '@ironclad/rivet-core';
import { pluginRefreshCounterState, pluginsState } from '../state/plugins';
import { produce } from 'immer';
import { match } from 'ts-pattern';
import { isNotNull } from '../utils/genericUtilFunctions';
import { getError } from '../utils/errors';
import * as Rivet from '@ironclad/rivet-core';
import { useLoadPackagePlugin } from './useLoadPackagePlugin';
import useAsyncEffect from 'use-async-effect';

export function useProjectPlugins() {
  const pluginSpecs = useRecoilValue(projectPluginsState);
  const [plugins, setPlugins] = useRecoilState(pluginsState);
  const setPluginRefreshCounter = useSetRecoilState(pluginRefreshCounterState);
  const { loadPackagePlugin } = useLoadPackagePlugin({
    onLog: (message) => console.log(message),
  });

  useAsyncEffect(async () => {
    resetGlobalRivetNodeRegistry();

    setPlugins(pluginSpecs.map((spec) => ({ id: spec.id, spec, loaded: false })));

    const loadedPlugins: Rivet.RivetPlugin[] = [];
    for (const spec of pluginSpecs) {
      try {
        const loadedPlugin = await match(spec)
          .with({ type: 'built-in' }, async (spec) => {
            const { id } = spec;
            if (id in rivetPlugins) {
              return rivetPlugins[id as keyof typeof rivetPlugins];
            }
            throw new Error(`Unknown built-in plugin ${name}.`);
          })
          .with({ type: 'uri' }, async (spec) => {
            const plugin = ((await import(/* @vite-ignore */ spec.uri)) as { default: Rivet.RivetPluginInitializer })
              .default;

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

        loadedPlugins.push(loadedPlugin);
      } catch (err) {
        console.error(`Failed to load plugin ${spec.id}: ${getError(err).message}`);
        return null;
      }
    }

    for (const plugin of loadedPlugins.filter(isNotNull)) {
      globalRivetNodeRegistry.registerPlugin(plugin);
      console.log(`Loaded plugin: ${plugin.id}`);
    }

    setPluginRefreshCounter((oldValue) => oldValue + 1);
  }, [pluginSpecs]);
}
