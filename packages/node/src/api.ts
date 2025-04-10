import {
  type DataValue,
  type NodeRegistration,
  type Project,
  type StringPluginConfigurationSpec,
  globalRivetNodeRegistry,
  type AttachedData,
  coreCreateProcessor,
  loadProjectFromString,
  loadProjectAndAttachedDataFromString,
  type RunGraphOptions,
  DEFAULT_CHAT_NODE_TIMEOUT,
  type Settings,
} from '@ironclad/rivet-core';

import { readFile } from 'node:fs/promises';

import { NodeNativeApi } from './native/NodeNativeApi.js';
import * as events from 'node:events';
import { NodeCodeRunner } from './native/NodeCodeRunner.js';
import type { RivetDebuggerServer } from './debugger.js';
import { NodeProjectReferenceLoader } from './native/NodeProjectReferenceLoader.js';

export async function loadProjectFromFile(path: string): Promise<Project> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectFromString(content);
}

export async function loadProjectAndAttachedDataFromFile(path: string): Promise<[Project, AttachedData]> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectAndAttachedDataFromString(content);
}

export async function runGraphInFile(path: string, options: NodeRunGraphOptions): Promise<Record<string, DataValue>> {
  const project = await loadProjectFromFile(path);
  return runGraph(project, options);
}

export type NodeRunGraphOptions = RunGraphOptions & {
  remoteDebugger?: RivetDebuggerServer;
};

export function createProcessor(
  project: Project,
  options: NodeRunGraphOptions,
): ReturnType<typeof coreCreateProcessor> {
  const processor = coreCreateProcessor(project, options);

  processor.processor.executor = 'nodejs';

  processor.processor.on('newAbortController', (controller) => {
    events.setMaxListeners(0, controller.signal);
  });

  if (options.remoteDebugger) {
    options.remoteDebugger.attach(processor.processor);
  }

  let pluginEnv = options.pluginEnv;
  if (!pluginEnv) {
    // If unset, use process.env
    pluginEnv = getPluginEnvFromProcessEnv(options.registry);
  }

  return {
    ...processor,
    async run() {
      const outputs = await processor.processor.processGraph(
        {
          nativeApi: options.nativeApi ?? new NodeNativeApi(),
          datasetProvider: options.datasetProvider,
          audioProvider: options.audioProvider,
          tokenizer: options.tokenizer,
          codeRunner: options.codeRunner ?? new NodeCodeRunner(),
          projectPath: options.projectPath,
          projectReferenceLoader: options.projectReferenceLoader ?? new NodeProjectReferenceLoader(),
          settings: {
            openAiKey: options.openAiKey ?? process.env.OPENAI_API_KEY ?? '',
            openAiOrganization: options.openAiOrganization ?? process.env.OPENAI_ORG_ID ?? '',
            openAiEndpoint: options.openAiEndpoint ?? process.env.OPENAI_ENDPOINT ?? '',
            pluginEnv: pluginEnv ?? {},
            pluginSettings: options.pluginSettings ?? {},
            recordingPlaybackLatency: 1000,
            chatNodeHeaders: options.chatNodeHeaders ?? {},
            chatNodeTimeout: options.chatNodeTimeout ?? DEFAULT_CHAT_NODE_TIMEOUT,
            throttleChatNode: options.throttleChatNode ?? 100,
          } satisfies Required<Settings>,
          getChatNodeEndpoint: options.getChatNodeEndpoint,
        },
        processor.inputs,
        processor.contextValues,
      );

      return outputs;
    },
  };
}

export async function runGraph(project: Project, options: NodeRunGraphOptions): Promise<Record<string, DataValue>> {
  const processorInfo = createProcessor(project, options);
  return processorInfo.run();
}

function getPluginEnvFromProcessEnv(registry?: NodeRegistration) {
  const pluginEnv: Record<string, string> = {};
  for (const plugin of (registry ?? globalRivetNodeRegistry).getPlugins() ?? []) {
    const configs = Object.entries(plugin.configSpec ?? {}).filter(([, c]) => c.type === 'string') as [
      string,
      StringPluginConfigurationSpec,
    ][];
    for (const [configName, config] of configs) {
      if (config.pullEnvironmentVariable) {
        const envVarName =
          typeof config.pullEnvironmentVariable === 'string'
            ? config.pullEnvironmentVariable
            : config.pullEnvironmentVariable === true
              ? configName
              : undefined;
        if (envVarName) {
          pluginEnv[envVarName] = process.env[envVarName] ?? '';
        }
      }
    }
  }
  return pluginEnv;
}
