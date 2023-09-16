import {
  ArrayDataValue,
  BoolDataValue,
  DataValue,
  DateDataValue,
  DateTimeDataValue,
  ExternalFunction,
  GraphId,
  GraphProcessor,
  NativeApi,
  NodeRegistration,
  NodeGraph,
  NumberDataValue,
  ObjectDataValue,
  ProcessContext,
  ProcessEvents,
  Project,
  ProjectId,
  Settings,
  StringPluginConfigurationSpec,
  StringDataValue,
  VectorDataValue,
  deserializeProject,
  globalRivetNodeRegistry,
} from '@ironclad/rivet-core';

import { readFile } from 'node:fs/promises';
import { RivetDebuggerServer } from './debugger.js';
import { PascalCase } from 'type-fest';
import { NodeNativeApi } from './native/NodeNativeApi.js';
import { mapValues } from 'lodash-es';
import { AttachedData } from '../../core/src/utils/serialization/serializationUtils.js';

export type LoosedDataValue<T extends DataValue> = T extends StringDataValue
  ? StringDataValue | string
  : T extends NumberDataValue
  ? NumberDataValue | number
  : T extends BoolDataValue
  ? BoolDataValue | boolean
  : T extends DateTimeDataValue
  ? DateTimeDataValue | Date
  : T extends ObjectDataValue
  ? ObjectDataValue | Record<string, unknown>
  : T extends ArrayDataValue<StringDataValue>
  ? ArrayDataValue<StringDataValue> | string[]
  : T extends ArrayDataValue<NumberDataValue>
  ? ArrayDataValue<NumberDataValue> | number[]
  : T extends ArrayDataValue<BoolDataValue>
  ? ArrayDataValue<BoolDataValue> | boolean[]
  : T extends ArrayDataValue<DateDataValue>
  ? ArrayDataValue<DateDataValue> | Date[]
  : T extends ArrayDataValue<ObjectDataValue>
  ? ArrayDataValue<ObjectDataValue> | Record<string, unknown>[]
  : DataValue;

export function looseToDataValue(value: LoosedDataValue<DataValue>): DataValue {
  if (typeof value === 'string') {
    return { type: 'string', value };
  }

  if (typeof value === 'number') {
    return { type: 'number', value };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }

  if (value == null) {
    return { type: 'any', value };
  }

  if ('type' in value && typeof value.type === 'string' && 'value' in value) {
    return value as DataValue;
  }

  if (value instanceof Date) {
    return { type: 'datetime', value: value.toISOString() };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'any[]', value };
    }

    if (typeof value[0] === 'string') {
      return { type: 'string[]', value: value as string[] };
    }

    if (typeof value[0] === 'number') {
      return { type: 'number[]', value: value as number[] };
    }

    if (typeof value[0] === 'boolean') {
      return { type: 'boolean[]', value: value as boolean[] };
    }

    if (value[0] instanceof Date) {
      return { type: 'datetime[]', value: (value as Date[]).map((v) => v.toISOString()) };
    }

    return { type: 'any[]', value };
  }

  return { type: 'object', value };
}

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

export type RunGraphOptions<
  Inputs extends {} = Record<string, LoosedDataValue<DataValue>>,
  GraphNameOrId extends string = string,
> = {
  graph: GraphNameOrId;
  inputs?: Inputs;
  context?: Record<string, LoosedDataValue<DataValue>>;
  remoteDebugger?: RivetDebuggerServer;
  nativeApi?: NativeApi;
  externalFunctions?: {
    [key: string]: ExternalFunction;
  };
  onUserEvent?: {
    [key: string]: (data: DataValue | undefined) => void;
  };
  abortSignal?: AbortSignal;
  registry?: NodeRegistration;
} & {
  [P in keyof ProcessEvents as `on${PascalCase<P>}`]?: (params: ProcessEvents[P]) => void;
} & Settings;

export async function runGraphInFile(path: string, options: RunGraphOptions): Promise<Record<string, DataValue>> {
  const project = await loadProjectFromFile(path);
  return runGraph(project, options);
}

type TypedProject = {
  metadata: {
    id: string;
  };
  graphs: {};
};

type TypedGraphInfo = {
  metadata: {
    id: string;
    name: string;
    description: string;
  };

  inputs: object;
  outputs: object;
};

type TypedOptions<T extends TypedProject, GraphName extends keyof T['graphs'] = keyof T['graphs']> = Pick<
  {
    [P in keyof T['graphs']]: T['graphs'][P] extends TypedGraphInfo
      ? RunGraphOptions<T['graphs'][P]['inputs'], T['graphs'][P]['metadata']['id'] | T['graphs'][P]['metadata']['name']>
      : RunGraphOptions;
  },
  GraphName
>[GraphName];

type Outputs<T extends TypedProject, GraphName extends keyof T['graphs'] = keyof T['graphs']> = Pick<
  {
    [P in keyof T['graphs']]: T['graphs'][P] extends TypedGraphInfo
      ? T['graphs'][P]['outputs']
      : Record<string, DataValue>;
  },
  GraphName
>[GraphName];

export function createProcessor<T extends TypedProject, GraphName extends keyof T['graphs']>(
  project: T,
  options: TypedOptions<T, GraphName>,
) {
  const { graph, inputs = {}, context = {} } = options;
  const asProject = project as unknown as Project;

  const graphId =
    graph in project.graphs
      ? graph
      : Object.values(asProject.graphs).find((g) => g.metadata?.name === graph)?.metadata?.id;

  if (!graphId) {
    throw new Error('Graph not found');
  }

  const processor = new GraphProcessor(asProject, graphId as GraphId, options.registry);

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

  const resolvedInputs: Record<string, DataValue> = mapValues(inputs, (value) => looseToDataValue(value as any));
  const resolvedContextValues: Record<string, DataValue> = mapValues(context, (value) => looseToDataValue(value));

  let pluginEnv = options.pluginEnv;
  if (!pluginEnv) {
    // If unset, use process.env
    pluginEnv = getPluginEnvFromProcessEnv(registry);
  }

  return {
    processor,
    inputs: resolvedInputs,
    contextValues: resolvedContextValues,
    async run() {
      const outputs = await processor.processGraph(
        {
          nativeApi: options.nativeApi ?? new NodeNativeApi(),
          settings: {
            openAiKey: options.openAiKey ?? '',
            openAiOrganization: options.openAiOrganization ?? '',
            openAiEndpoint: options.openAiEndpoint ?? '',
            pluginEnv: options.pluginEnv ?? {},
            pluginSettings: options.pluginSettings ?? {},
            recordingPlaybackLatency: 1000,
          } satisfies Required<Settings>,
        },
        resolvedInputs,
        resolvedContextValues,
      );

      return outputs as Outputs<T, GraphName>;
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
