import {
  type ChartNode,
  coerceTypeOptional,
  type ProcessId,
  type InternalProcessContext,
  type PortId,
} from '@ironclad/rivet-core';
import { useCallback } from 'react';
import { GptTokenizerTokenizer } from '../../../core/src/integrations/GptTokenizerTokenizer';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { nanoid } from 'nanoid/non-secure';
import { useRecoilValue } from 'recoil';
import { settingsState } from '../state/settings';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { datasetProvider } from '../utils/globals';

export function useGetAdHocInternalProcessContext() {
  const settings = useRecoilValue(settingsState);
  const plugins = useDependsOnPlugins();

  return useCallback(
    async (options?: {
      onPartialResult?: (result: string) => void;
      signal?: AbortSignal;
    }): Promise<InternalProcessContext> => {
      return {
        executor: 'browser',
        node: {} as ChartNode,
        tokenizer: new GptTokenizerTokenizer(),
        contextValues: {},
        createSubProcessor: undefined!,
        settings: await fillMissingSettingsFromEnvironmentVariables(settings, plugins),
        nativeApi: new TauriNativeApi(),
        datasetProvider,
        processId: nanoid() as ProcessId,
        executionCache: new Map(),
        externalFunctions: {},
        getGlobal: undefined!,
        graphInputs: {},
        graphOutputs: {},
        project: undefined!,
        raiseEvent: undefined!,
        setGlobal: undefined!,
        signal: options?.signal ?? new AbortController().signal,
        trace: (value) => console.log(value),
        waitEvent: undefined!,
        waitForGlobal: undefined!,
        onPartialOutputs: (outputs) => {
          const responsePartial = coerceTypeOptional(outputs['response' as PortId], 'string');
          if (responsePartial) {
            options?.onPartialResult?.(responsePartial);
          }
        },
        abortGraph: undefined!,
        getPluginConfig: undefined!,
        attachedData: {},
      };
    },
    [plugins, settings],
  );
}
