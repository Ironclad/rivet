import { type ChartNode, getPluginConfig, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { datasetProvider } from '../utils/globals';
import { useRecoilValue } from 'recoil';
import { selectedExecutorState } from '../state/execution';
import { type RivetUIContext } from '../../../core/src/model/RivetUIContext';
import { settingsState } from '../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { projectState } from '../state/savedGraphs';
import { graphState } from '../state/graph';
import { useStableCallback } from './useStableCallback';

export function useGetRivetUIContext() {
  const selectedExecutor = useRecoilValue(selectedExecutorState);
  const settings = useRecoilValue(settingsState);
  const plugins = useDependsOnPlugins();
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);

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
