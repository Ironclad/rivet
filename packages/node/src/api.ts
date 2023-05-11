import {
  DataValue,
  GraphId,
  GraphProcessor,
  NativeApi,
  ProcessContext,
  ProcessEvents,
  Project,
  Settings,
} from '@ironclad/nodai-core';

import { readFile } from 'node:fs/promises';
import { NodaiDebuggerServer } from './debugger';
import { PascalCase } from 'type-fest';
import { NodeNativeApi } from './native/NodeNativeApi';
import { mapValues } from 'lodash-es';

export async function loadProjectFromFile(path: string): Promise<Project> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectFromString(content);
}

export function loadProjectFromString(content: string): Project {
  const json = JSON.parse(content);
  if ('metadata' in json && 'graphs' in json) {
    return json as Project;
  }

  throw new Error('Invalid project file');
}

export type LooseDataValue = DataValue | string | number | boolean;

export type RunGraphOptions = {
  graph: string;
  inputs?: Record<string, LooseDataValue>;
  remoteDebugger?: NodaiDebuggerServer;
  onStart?: () => void;
  onNodeStart?: (nodeId: string) => void;
} & {
  [P in keyof ProcessEvents as `on${PascalCase<P>}`]?: (params: ProcessEvents[P]) => void;
} & {
  nativeApi?: NativeApi;
} & Settings;

export async function runGraphInFile(path: string, options: RunGraphOptions): Promise<Record<string, DataValue>> {
  const project = await loadProjectFromFile(path);
  return runGraph(project, options);
}

export async function runGraph(project: Project, options: RunGraphOptions): Promise<Record<string, DataValue>> {
  const { graph, inputs = {} } = options;

  const graphId =
    graph in project.graphs
      ? graph
      : Object.values(project.graphs).find((g) => g.metadata?.name === graph)?.metadata?.id;

  if (!graphId) {
    throw new Error('Graph not found');
  }

  const processor = new GraphProcessor(project, graphId as GraphId);

  if (options?.remoteDebugger) {
    options.remoteDebugger.attach(processor);
  }

  if (options?.onStart) {
    processor.on('start', options.onStart);
  }

  if (options?.onNodeStart) {
    processor.on('nodeStart', options.onNodeStart);
  }

  if (options?.onNodeFinish) {
    processor.on('nodeFinish', options.onNodeFinish);
  }

  if (options?.onNodeError) {
    processor.on('nodeError', options.onNodeError);
  }

  if (options?.onNodeExcluded) {
    processor.on('nodeExcluded', options.onNodeExcluded);
  }

  if (options?.onPartialOutput) {
    processor.on('partialOutput', options.onPartialOutput);
  }

  if (options?.onUserInput) {
    processor.on('userInput', options.onUserInput);
  }

  if (options?.onDone) {
    processor.on('done', options.onDone);
  }

  if (options?.onAbort) {
    processor.on('abort', options.onAbort);
  }

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

  const outputs = await processor.processGraph(
    {
      nativeApi: options.nativeApi ?? new NodeNativeApi(),
      settings: {
        openAiKey: options.openAiKey,
        openAiOrganization: options.openAiOrganization,
      },
    },
    resolvedInputs,
  );

  return outputs;
}
