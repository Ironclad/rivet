import type { PascalCase } from 'type-fest';
import {
  type AttachedData,
  type AudioProvider,
  type DataValue,
  type DatasetProvider,
  type ExternalFunction,
  type GraphId,
  type MCPProvider,
  type NativeApi,
  type NodeRegistration,
  type ProcessContext,
  type ProcessEvents,
  type Project,
  type RivetEventStreamFilterSpec,
  type Settings,
} from '../index.js';
import { getProcessorEvents, getProcessorSSEStream, getSingleNodeStream } from './streaming.js';
// eslint-disable-next-line import/no-cycle -- Necessary cycle
import { GraphProcessor } from '../model/GraphProcessor.js';
import { deserializeProject } from '../utils/serialization/serialization.js';
import { DEFAULT_CHAT_NODE_TIMEOUT } from '../utils/defaults.js';
import type { Tokenizer } from '../integrations/Tokenizer.js';
import { looseDataValuesToDataValues, type LooseDataValue } from './looseDataValue.js';
import type { CodeRunner } from '../integrations/CodeRunner.js';
import type { ProjectReferenceLoader } from '../model/ProjectReferenceLoader.js';

export type RunGraphOptions = {
  graph?: string;
  inputs?: Record<string, LooseDataValue>;
  context?: Record<string, LooseDataValue>;
  nativeApi?: NativeApi;
  datasetProvider?: DatasetProvider;
  audioProvider?: AudioProvider;
  mcpProvider?: MCPProvider;
  externalFunctions?: {
    [key: string]: ExternalFunction;
  };
  onUserEvent?: {
    [key: string]: (data: DataValue | undefined) => void;
  };
  abortSignal?: AbortSignal;
  registry?: NodeRegistration<any, any>;
  includeTrace?: boolean;
  getChatNodeEndpoint?: ProcessContext['getChatNodeEndpoint'];
  tokenizer?: Tokenizer;
  codeRunner?: CodeRunner;
  projectPath?: string;
  projectReferenceLoader?: ProjectReferenceLoader;
} & {
  [P in keyof ProcessEvents as `on${PascalCase<P>}`]?: (params: ProcessEvents[P]) => void;
} & Settings;

export function coreCreateProcessor(project: Project, options: RunGraphOptions) {
  const { graph, inputs = {}, context = {} } = options;

  const graphId = graph
    ? graph in project.graphs
      ? graph
      : Object.values(project.graphs).find((g) => g.metadata?.name === graph)?.metadata?.id
    : project.metadata.mainGraphId;

  if (!graphId) {
    throw new Error(`Graph not found, and no main graph specified.`);
  }

  // TODO: Consolidate options into one object
  const processor = new GraphProcessor(project, graphId as GraphId, options.registry, options.includeTrace);

  if (options.onStart) {
    processor.on('start', options.onStart);
  }

  if (options.onNodeStart) {
    processor.on('nodeStart', options.onNodeStart);
  }

  if (options.onNodeFinish) {
    processor.on('nodeFinish', options.onNodeFinish);
  }

  if (options.onNodeError) {
    processor.on('nodeError', options.onNodeError);
  }

  if (options.onNodeExcluded) {
    processor.on('nodeExcluded', options.onNodeExcluded);
  }

  if (options.onGraphStart) {
    processor.on('graphStart', options.onGraphStart);
  }

  if (options.onGraphError) {
    processor.on('graphError', options.onGraphError);
  }

  if (options.onGraphFinish) {
    processor.on('graphFinish', options.onGraphFinish);
  }

  if (options.onPartialOutput) {
    processor.on('partialOutput', options.onPartialOutput);
  }

  if (options.onUserInput) {
    processor.on('userInput', options.onUserInput);
  }

  if (options.onDone) {
    processor.on('done', options.onDone);
  }

  if (options.onAbort) {
    processor.on('abort', options.onAbort);
  }

  if (options.onGraphAbort) {
    processor.on('graphAbort', options.onGraphAbort);
  }

  if (options.onTrace) {
    processor.on('trace', options.onTrace);
  }

  if (options.onNodeOutputsCleared) {
    processor.on('nodeOutputsCleared', options.onNodeOutputsCleared);
  }

  if (options.externalFunctions) {
    for (const [name, fn] of Object.entries(options.externalFunctions)) {
      processor.setExternalFunction(name, fn);
    }
  }

  if (options.onUserEvent) {
    for (const [name, fn] of Object.entries(options.onUserEvent)) {
      processor.onUserEvent(name, fn);
    }
  }

  options.abortSignal?.addEventListener('abort', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    processor.abort();
  });

  const resolvedInputs = looseDataValuesToDataValues(inputs);
  const resolvedContextValues = looseDataValuesToDataValues(context);

  return {
    processor,
    inputs: resolvedInputs,
    contextValues: resolvedContextValues,
    getEvents: (spec: RivetEventStreamFilterSpec) => getProcessorEvents(processor, spec),
    getSSEStream: (spec: RivetEventStreamFilterSpec) => getProcessorSSEStream(processor, spec),
    streamNode: (nodeIdOrTitle: string) => getSingleNodeStream(processor, nodeIdOrTitle),
    async run() {
      const outputs = await processor.processGraph(
        {
          nativeApi: options.nativeApi,
          datasetProvider: options.datasetProvider,
          audioProvider: options.audioProvider,
          mcpProvider: options.mcpProvider,
          codeRunner: options.codeRunner,
          projectPath: options.projectPath,
          projectReferenceLoader: options.projectReferenceLoader,
          settings: {
            openAiKey: options.openAiKey ?? '',
            openAiOrganization: options.openAiOrganization ?? '',
            openAiEndpoint: options.openAiEndpoint ?? '',
            pluginEnv: options.pluginEnv ?? {},
            pluginSettings: options.pluginSettings ?? {},
            recordingPlaybackLatency: 1000,
            chatNodeHeaders: options.chatNodeHeaders ?? {},
            chatNodeTimeout: options.chatNodeTimeout ?? DEFAULT_CHAT_NODE_TIMEOUT,
            throttleChatNode: options.throttleChatNode ?? 100,
          } satisfies Required<Settings>,
          getChatNodeEndpoint: options.getChatNodeEndpoint,
        },
        resolvedInputs,
        resolvedContextValues,
      );

      return outputs;
    },
  };
}

export async function coreRunGraph(project: Project, options: RunGraphOptions): Promise<Record<string, DataValue>> {
  const processorInfo = coreCreateProcessor(project, options);
  return processorInfo.run();
}

export function loadProjectFromString(content: string): Project {
  const [project] = deserializeProject(content);
  return project;
}

export function loadProjectAndAttachedDataFromString(content: string): [Project, AttachedData] {
  return deserializeProject(content);
}
