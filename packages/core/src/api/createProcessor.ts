import type { PascalCase } from 'type-fest';
import {
  type AttachedData,
  type DataValue,
  type DatasetProvider,
  type ExternalFunction,
  type GraphId,
  type NativeApi,
  type NodeRegistration,
  type ProcessContext,
  type ProcessEvents,
  type Project,
  type RivetEventStreamFilterSpec,
  type Settings,
} from '../index.js';
import { mapValues } from '../utils/typeSafety.js';
import { getProcessorEvents, getProcessorSSEStream, getSingleNodeStream } from './streaming.js';
import { GraphProcessor } from '../model/GraphProcessor.js';
import { deserializeProject } from '../utils/serialization/serialization.js';
import { DEFAULT_CHAT_NODE_TIMEOUT } from '../utils/defaults.js';

export type LooseDataValue = DataValue | string | number | boolean;

export type RunGraphOptions = {
  graph?: string;
  inputs?: Record<string, LooseDataValue>;
  context?: Record<string, LooseDataValue>;
  nativeApi?: NativeApi;
  datasetProvider?: DatasetProvider;
  externalFunctions?: {
    [key: string]: ExternalFunction;
  };
  onUserEvent?: {
    [key: string]: (data: DataValue | undefined) => void;
  };
  abortSignal?: AbortSignal;
  registry?: NodeRegistration;
  getChatNodeEndpoint?: ProcessContext['getChatNodeEndpoint'];
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

  const processor = new GraphProcessor(project, graphId as GraphId, options.registry);

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
    processor.abort();
  });

  const resolvedInputs: Record<string, DataValue> = mapValues(inputs, (value): DataValue => {
    if (typeof value === 'string') {
      return { type: 'string', value };
    }

    if (typeof value === 'number') {
      return { type: 'number', value };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean', value };
    }

    return value;
  });

  const resolvedContextValues: Record<string, DataValue> = mapValues(context, (value): DataValue => {
    if (typeof value === 'string') {
      return { type: 'string', value };
    }

    if (typeof value === 'number') {
      return { type: 'number', value };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean', value };
    }

    return value;
  });

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
          settings: {
            openAiKey: options.openAiKey ?? '',
            openAiOrganization: options.openAiOrganization ?? '',
            openAiEndpoint: options.openAiEndpoint ?? '',
            pluginEnv: options.pluginEnv ?? {},
            pluginSettings: options.pluginSettings ?? {},
            recordingPlaybackLatency: 1000,
            chatNodeHeaders: options.chatNodeHeaders ?? {},
            chatNodeTimeout: options.chatNodeTimeout ?? DEFAULT_CHAT_NODE_TIMEOUT,
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
