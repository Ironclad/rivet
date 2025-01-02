import { type ChartNode, getPluginConfig, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { datasetProvider } from '../utils/globals';
import { selectedExecutorState } from '../state/execution';
import { type RivetUIContext } from '../../../core/src/model/RivetUIContext';
import { settingsState } from '../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { projectState } from '../state/savedGraphs';
import { graphState } from '../state/graph';
import { useStableCallback } from './useStableCallback';
import { useAtomValue } from 'jotai';

export function useGetRivetUIContext() {
  const selectedExecutor = useAtomValue(selectedExecutorState);
  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();
  const project = useAtomValue(projectState);
  const graph = useAtomValue(graphState);

  return useStableCallback(async ({ node }: { node?: ChartNode }) => {
    let getPluginConfigFn: RivetUIContext['getPluginConfig'] = () => undefined;
    if (node) {
      const nodePlugin = globalRivetNodeRegistry.getPluginFor(node?.type);
      if (nodePlugin) {
        getPluginConfigFn = (name) => getPluginConfig(nodePlugin, settings, name);
      }
    }

    const context: RivetUIContext = {
      datasetProvider,
      executor: selectedExecutor,
      settings: await fillMissingSettingsFromEnvironmentVariables(settings, plugins),
      project,
      graph,
      node,
      getPluginConfig: getPluginConfigFn,
    };

    return context;
  });
}
