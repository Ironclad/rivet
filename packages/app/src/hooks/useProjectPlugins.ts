import { useRecoilState, useRecoilValue } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import { useEffect } from 'react';
import { globalRivetNodeRegistry, resetGlobalRivetNodeRegistry } from '@ironclad/rivet-core';
import { RivetPlugin } from '../../../core/src/model/RivetPlugin';
import { pluginsState } from '../state/plugins';
import { produce } from 'immer';
import { ECDH } from 'crypto';
import { match } from 'ts-pattern';
import { plugins as rivetPlugins } from '@ironclad/rivet-core';

export function useProjectPlugins() {
  const pluginSpecs = useRecoilValue(projectPluginsState);
  const [plugins, setPlugins] = useRecoilState(pluginsState);

  const builtInPlugins = ['anthropic'] as const;

  useEffect(() => {
    resetGlobalRivetNodeRegistry();

    setPlugins(pluginSpecs.map((spec) => ({ id: spec.id, uri: spec.uri, loaded: false })));

    (async () => {
      const validSpecs = pluginSpecs.filter((spec) => spec.uri.length > 0);

      const plugins = await Promise.all(
        validSpecs.map(async (spec) => {
          const builtInMatch = /built-in:(.*)/.exec(spec.uri);

          let loadedPlugin: RivetPlugin;

          if (builtInMatch) {
            const [, name] = builtInMatch;

            loadedPlugin = match(name)
              .with('anthropic', () => rivetPlugins.anthropic)
              .otherwise(() => {
                throw new Error(`Unknown built-in plugin ${name}.`);
              });
          } else {
            loadedPlugin = ((await import(spec.uri)) as { default: RivetPlugin }).default;
            if (!loadedPlugin?.id) {
              throw new Error(`Plugin ${spec.id} does not have an id`);
            }
          }

          console.log(`Loaded plugin: ${loadedPlugin.id}`);

          setPlugins((oldPlugins) =>
            produce(oldPlugins, (draft) => {
              const plugin = draft.find((plugin) => plugin.id === spec.id);
              if (plugin) {
                plugin.loaded = true;
              }
            }),
          );

          return loadedPlugin;
        }),
      );

      for (const plugin of plugins) {
        globalRivetNodeRegistry.registerPlugin(plugin);
      }
    })();
  }, [pluginSpecs]);
}
