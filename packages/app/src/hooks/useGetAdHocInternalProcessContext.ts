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
import { useAtomValue } from 'jotai';
import { settingsState } from '../state/settings';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { audioProvider, datasetProvider } from '../utils/globals';
import { loadedProjectState, referencedProjectsState } from '../state/savedGraphs';
import { TauriProjectReferenceLoader } from '../model/TauriProjectReferenceLoader';

export function useGetAdHocInternalProcessContext() {
  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();
  const referencedProjects = useAtomValue(referencedProjectsState);
  const loadedProject = useAtomValue(loadedProjectState);

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
        audioProvider,
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
        requestUserInput: undefined!,
        codeRunner: undefined!,
        referencedProjects,
        projectPath: loadedProject.path ?? undefined,
        projectReferenceLoader: new TauriProjectReferenceLoader(),
      };
    },
    [plugins, settings, loadedProject, referencedProjects],
  );
}
