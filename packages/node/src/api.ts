import {
  type DataValue,
  type DatasetProvider,
  type ExternalFunction,
  type GraphId,
  GraphProcessor,
  type NativeApi,
  type NodeRegistration,
  type ProcessContext,
  type ProcessEvents,
  type Project,
  type Settings,
  type StringPluginConfigurationSpec,
  deserializeProject,
  globalRivetNodeRegistry,
  type AttachedData,
  type NodeId,
  coerceType,
  type PortId,
  type GraphOutputs,
  type Outputs,
  type Inputs,
} from '@ironclad/rivet-core';

import { readFile } from 'node:fs/promises';
import { type RivetDebuggerServer } from './debugger.js';
import type { PascalCase } from 'type-fest';
import { NodeNativeApi } from './native/NodeNativeApi.js';
import { mapValues } from 'lodash-es';
import * as events from 'node:events';
import { match } from 'ts-pattern';

export async function loadProjectFromFile(path: string): Promise<Project> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectFromString(content);
}

export function loadProjectFromString(content: string): Project {
  const [project] = deserializeProject(content);
  return project;
}

export async function loadProjectAndAttachedDataFromFile(path: string): Promise<[Project, AttachedData]> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectAndAttachedDataFromString(content);
}

export function loadProjectAndAttachedDataFromString(content: string): [Project, AttachedData] {
  return deserializeProject(content);
}

export type LooseDataValue = DataValue | string | number | boolean;

export type RunGraphOptions = {
  graph: string;
  inputs?: Record<string, LooseDataValue>;
  context?: Record<string, LooseDataValue>;
  remoteDebugger?: RivetDebuggerServer;
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

export async function runGraphInFile(path: string, options: RunGraphOptions): Promise<Record<string, DataValue>> {
  const project = await loadProjectFromFile(path);
  return runGraph(project, options);
}

export function createProcessor(project: Project, options: RunGraphOptions) {
  const { graph, inputs = {}, context = {}, registry } = options;

  const graphId =
    graph in project.graphs
      ? graph
      : Object.values(project.graphs).find((g) => g.metadata?.name === graph)?.metadata?.id;

  if (!graphId) {
    throw new Error('Graph not found');
  }

  const processor = new GraphProcessor(project, graphId as GraphId, options.registry);
  processor.executor = 'nodejs';

  processor.on('newAbortController', (controller) => {
    events.setMaxListeners(100, controller.signal);
  });

  if (options.remoteDebugger) {
    options.remoteDebugger.attach(processor);
  }

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

  let pluginEnv = options.pluginEnv;
  if (!pluginEnv) {
    // If unset, use process.env
    pluginEnv = getPluginEnvFromProcessEnv(registry);
  }

  return {
    processor,
    inputs: resolvedInputs,
    contextValues: resolvedContextValues,
    getEvents: (spec: RivetEventStreamFilterSpec) => getProcessorEvents(processor, spec),
    getEventStream: (spec: RivetEventStreamFilterSpec) => getProcessorEventStream(processor, spec),
    async run() {
      const outputs = await processor.processGraph(
        {
          nativeApi: options.nativeApi ?? new NodeNativeApi(),
          datasetProvider: options.datasetProvider,
          settings: {
            openAiKey: options.openAiKey ?? '',
            openAiOrganization: options.openAiOrganization ?? '',
            openAiEndpoint: options.openAiEndpoint ?? '',
            pluginEnv: options.pluginEnv ?? {},
            pluginSettings: options.pluginSettings ?? {},
            recordingPlaybackLatency: 1000,
            chatNodeHeaders: options.chatNodeHeaders ?? {},
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

export async function runGraph(project: Project, options: RunGraphOptions): Promise<Record<string, DataValue>> {
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

export type RivetEventStreamFilterSpec = {
  /** Stream partial output deltas for the specified node IDs or node titles. */
  partialOutputs?: string[] | true;

  /** Send the graph output when done? */
  done?: boolean;

  /** If the graph errors, send an error event? */
  error?: boolean;

  /** Stream node start events for the specified node IDs or node titles. */
  nodeStart?: string[] | true;

  /** Stream node finish events for the specified nodeIDs or node titles. */
  nodeFinish?: string[] | true;
};

/** Map of all possible event names to their data for streaming events. */
export type RivetEventStreamEvent = {
  /** Deltas for partial outputs. */
  partialOutput: {
    nodeId: NodeId;
    nodeTitle: string;
    delta: string;
  };

  nodeStart: {
    nodeId: NodeId;
    nodeTitle: string;
    inputs: Inputs;
  };

  nodeFinish: {
    nodeId: NodeId;
    nodeTitle: string;
    outputs: Outputs;
  };

  done: {
    graphOutput: GraphOutputs;
  };

  error: {
    error: string;
  };
};

export type RivetEventStreamEventInfo = {
  [P in keyof RivetEventStreamEvent]: {
    type: P;
  } & RivetEventStreamEvent[P];
}[keyof RivetEventStreamEvent];

/** A simplified way to listen and stream processor events, including filtering. */
export async function* getProcessorEvents(
  processor: GraphProcessor,
  spec: RivetEventStreamFilterSpec,
): AsyncGenerator<RivetEventStreamEventInfo, void> {
  const previousIndexes = new Map<NodeId, number>();
  for await (const event of processor.events()) {
    if (event.type === 'partialOutput') {
      if (
        spec.partialOutputs === true ||
        !spec.partialOutputs?.includes(event.node.id) ||
        !spec.partialOutputs?.includes(event.node.title)
      ) {
        return;
      }

      const currentOutput = coerceType(event.outputs['response' as PortId], 'string');

      const delta = currentOutput.slice(previousIndexes.get(event.node.id) ?? 0);

      yield {
        type: 'partialOutput',
        nodeId: event.node.id,
        nodeTitle: event.node.title,
        delta,
      };

      previousIndexes.set(event.node.id, currentOutput.length);
    } else if (event.type === 'done') {
      if (spec.done) {
        yield {
          type: 'done',
          graphOutput: event.results,
        };
      }
    } else if (event.type === 'error') {
      if (spec.error) {
        yield {
          type: 'error',
          error: typeof event.error === 'string' ? event.error : event.error.toString(),
        };
      }
    } else if (event.type === 'nodeStart') {
      if (
        spec.nodeStart === true ||
        spec.nodeStart?.includes(event.node.id) ||
        spec.nodeStart?.includes(event.node.title)
      ) {
        yield {
          type: 'nodeStart',
          inputs: event.inputs,
          nodeId: event.node.id,
          nodeTitle: event.node.title,
        };
      }
    } else if (event.type === 'nodeFinish') {
      if (
        spec.nodeFinish === true ||
        spec.nodeFinish?.includes(event.node.id) ||
        spec.nodeFinish?.includes(event.node.title)
      ) {
        yield {
          type: 'nodeFinish',
          outputs: event.outputs,
          nodeId: event.node.id,
          nodeTitle: event.node.title,
        };
      }
    }
  }
}

/**
 * Creates a ReadableStream for processor events, following the Server-Sent Events protocol.
 * https://developer.mozilla.org/en-US/docs/Web/API/EventSource
 *
 * Includes configuration for what events to send to the client, for example you can stream the partial output deltas
 * for specific nodes, and/or the graph output when done.
 */
export function getProcessorEventStream(
  processor: GraphProcessor,

  /** The spec for what you're streaming to the client */
  spec: RivetEventStreamFilterSpec,
) {
  const encoder = new TextEncoder();

  function sendEvent<T extends keyof RivetEventStreamEvent>(
    controller: ReadableStreamDefaultController,
    type: T,
    data: RivetEventStreamEvent[T],
  ) {
    const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(event));
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of getProcessorEvents(processor, spec)) {
          sendEvent(controller, event.type, event);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
