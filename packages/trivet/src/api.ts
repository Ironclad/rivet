import {
  DataValue,
  NativeApi,
  BaseDir,
  ReadDirOptions,
  GraphProcessor,
  Settings,
  GraphOutputNode,
  inferType,
} from '@ironclad/rivet-core';
import { cloneDeep, keyBy, mapValues, omit } from 'lodash-es';
import { TrivetGraphRunner, TrivetOpts, TrivetResults, TrivetTestCaseResult } from './trivetTypes.js';
import * as braintrust from 'braintrust';

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
}

export function createTestGraphRunner(opts: { openAiKey: string; braintrustApiKey?: string }): TrivetGraphRunner {
  return async (project, graphId, inputs) => {
    const processor = new GraphProcessor(project, graphId);
    const resolvedContextValues: Record<string, DataValue> = {};
    const outputs = await processor.processGraph(
      {
        nativeApi: new DummyNativeApi(),
        settings: {
          openAiKey: opts.openAiKey,
          openAiOrganization: '',
          pluginEnv: {},
          pluginSettings: {},
          recordingPlaybackLatency: 1000,
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

    let experiment = null;
    if (opts.braintrustApiKey) {
      experiment = await braintrust.init(testSuite.name ?? `Test Suite ${testSuite.id}`, {
        // TODO: It would be good to include the current user's name
        experiment: `trivet-${Date.now()}`,
        apiKey: opts.braintrustApiKey,
      });

      const summary = await experiment.summarize({ summarizeScores: false });
      opts.setBrainTrustSummary?.(testSuite.id, summary);
    } else {
      opts.setBrainTrustSummary?.(testSuite.id, undefined);
    }

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

          console.dir({ validationOutputs });
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

          if (experiment) {
            experiment.log({
              input: testCase.input,
              expected: testCase.expectedOutput,
              output: validationInputs.output!.value,
              scores: {
                ...validationResults.reduce(
                  (acc, r) => ({
                    ...acc,
                    [r.title]: r.valid ? 1 : 0,
                  }),
                  {},
                ),
                no_error: 1,
              },
              metadata: {
                testSuite: testSuite.id,
                testCase: testCase.id,
                iteration: i + 1,
                duration,
                passing: validationResults.every((r) => r.valid),
                message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
                outputs: mapValues(outputs, (dataValue) => dataValue.value),
              },
            });
          }

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
          if (experiment) {
            experiment.log({
              input: testCase.input,
              expected: testCase.expectedOutput,
              output: null,
              scores: {
                no_error: 0,
              },
              metadata: {
                testSuite: testSuite.id,
                testCase: testCase.id,
                iteration: i + 1,
              },
            });
          }

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

    if (experiment) {
      const summary = await experiment.summarize({ summarizeScores: false });
      opts.setBrainTrustSummary?.(testSuite.id, summary);
    }
  }
  return trivetResults;
}
