import {
  type DataValue,
  type NativeApi,
  type BaseDir,
  type ReadDirOptions,
  GraphProcessor,
  type Settings,
  type GraphOutputNode,
  inferType,
  DEFAULT_CHAT_NODE_TIMEOUT,
} from '@ironclad/rivet-core';
import { cloneDeep, keyBy, mapValues, omit } from 'lodash-es';
import {
  type TrivetGraphRunner,
  type TrivetOpts,
  type TrivetResults,
  type TrivetTestCaseResult,
} from './trivetTypes.js';

const TRUTHY_STRINGS = new Set(['true', 'TRUE']);

function validateOutput(v: DataValue) {
  switch (v.type) {
    case 'boolean':
      return v.value;
    case 'string':
      return TRUTHY_STRINGS.has(v.value);
    default:
      throw new Error(`Unexpected output type: ${v.type}`);
  }
}

export class DummyNativeApi implements NativeApi {
  readdir(path: string, baseDir?: BaseDir | undefined, options?: ReadDirOptions | undefined): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  readTextFile(path: string, baseDir?: BaseDir | undefined): Promise<string> {
    throw new Error('Method not implemented.');
  }
  readBinaryFile(path: string, baseDir?: BaseDir | undefined): Promise<Blob> {
    throw new Error('Method not implemented.');
  }
  writeTextFile(path: string, data: string, baseDir?: BaseDir | undefined): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exec(command: string, args: string[], options?: { cwd?: string | undefined } | undefined): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export function createTestGraphRunner(opts: { openAiKey: string; executor?: 'nodejs' | 'browser' }): TrivetGraphRunner {
  return async (project, graphId, inputs) => {
    const processor = new GraphProcessor(project, graphId);
    processor.executor = opts.executor;
    const resolvedContextValues: Record<string, DataValue> = {};
    const outputs = await processor.processGraph(
      {
        nativeApi: new DummyNativeApi(),
        settings: {
          openAiKey: opts.openAiKey,
          openAiOrganization: '',
          openAiEndpoint: '',
          pluginEnv: {},
          pluginSettings: {},
          recordingPlaybackLatency: 1000,
          chatNodeHeaders: {},
          chatNodeTimeout: DEFAULT_CHAT_NODE_TIMEOUT,
        } satisfies Required<Settings>,
      },
      inputs,
      resolvedContextValues,
    );
    return outputs;
  };
}

export async function runTrivet(opts: TrivetOpts): Promise<TrivetResults> {
  const { project, testSuites, runGraph, onUpdate, iterationCount = 1 } = opts;

  const graphsById = keyBy(project.graphs, (g) => g.metadata?.id ?? '');

  const trivetResults: TrivetResults = {
    testSuiteResults: [],
    iterationCount,
  };

  for (const testSuite of testSuites) {
    const testGraph = graphsById[testSuite.testGraph];
    const validationGraph = graphsById[testSuite.validationGraph];
    if (testGraph === undefined) {
      console.error('Missing test graph; skipping', testSuite.testGraph);
      continue;
    }
    if (validationGraph === undefined) {
      console.error('Missing validation graph; skipping', testSuite.validationGraph);
      continue;
    }

    const validationOutputNodesById = keyBy(
      validationGraph.nodes.filter((n): n is GraphOutputNode => n.type === 'graphOutput'),
      (n) => n.data.id,
    );

    const testCaseResults: TrivetTestCaseResult[] = [];

    onUpdate?.({
      ...trivetResults,
      testSuiteResults: [
        ...trivetResults.testSuiteResults,
        {
          id: testSuite.id,
          testGraph: testSuite.testGraph,
          validationGraph: testSuite.validationGraph,
          name: testSuite.name ?? 'Test',
          description: testSuite.description ?? 'It should pass.',
          testCaseResults: testCaseResults.slice(),
          passing: testCaseResults.every((r) => r.passing),
        },
      ],
    });

    for (const testCase of testSuite.testCases) {
      for (let i = 0; i < iterationCount; i++) {
        try {
          const resolvedInputs: Record<string, DataValue> = mapValues(testCase.input, inferType);
          const startTime = Date.now();
          const outputs = await runGraph(project, testGraph.metadata!.id!, resolvedInputs);
          const duration = Date.now() - startTime;
          const costOutput = outputs.cost;
          const cost = costOutput && costOutput.type === 'number' ? costOutput.value : 0;

          console.log('ran test graph', outputs);

          const validationInputs: Record<string, DataValue> = {
            input: {
              type: 'object',
              value: testCase.input,
            },
            expectedOutput: {
              type: 'object',
              value: testCase.expectedOutput,
            },
            output: {
              type: 'object',
              value: mapValues(outputs, (dataValue) => dataValue.value),
            },
          };

          console.log('running validation graph', validationInputs);

          const validationOutputs = omit(
            await runGraph(project, validationGraph.metadata!.id!, validationInputs),
            'cost',
          );

          const validationResults = Object.entries(validationOutputs).map(([outputId, result]) => {
            const node = validationOutputNodesById[outputId];
            if (node === undefined) {
              throw new Error('Missing node for validation');
            }
            const valid = validateOutput(result);
            return {
              id: node.id,
              title: node.title ?? 'Validation',
              description: node.description ?? 'It should be valid.',
              valid,
            };
          });
          testCaseResults.push({
            id: testCase.id,
            iteration: i + 1,
            passing: validationResults.every((r) => r.valid),
            message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
            outputs: mapValues(omit(outputs, 'cost'), (dataValue) => dataValue.value),
            duration,
            cost,
          });
        } catch (err) {
          testCaseResults.push({
            id: testCase.id,
            iteration: i + 1,
            passing: false,
            message: 'An error occurred',
            outputs: {},
            duration: 0,
            cost: 0,
            error: err,
          });
        }

        let existingTestSuite = trivetResults.testSuiteResults.find((ts) => ts.id === testSuite.id);
        if (existingTestSuite == null) {
          existingTestSuite = {
            id: testSuite.id,
            testGraph: testSuite.testGraph,
            validationGraph: testSuite.validationGraph,
            name: testSuite.name ?? 'Test',
            description: testSuite.description ?? 'It should pass.',
            testCaseResults: [],
            passing: false,
          };
          trivetResults.testSuiteResults.push(existingTestSuite);
        }
        existingTestSuite.testCaseResults = testCaseResults.slice();
        existingTestSuite.passing = testCaseResults.every((r) => r.passing);

        onUpdate?.(cloneDeep(trivetResults));
      }
    }
  }
  return trivetResults;
}
