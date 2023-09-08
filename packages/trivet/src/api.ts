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
import {
  TrivetEvents,
  TrivetGraphRunner,
  TrivetOpts,
  TrivetResults,
  TrivetTestCaseResult,
  TrivetTestSuiteResult,
} from './trivetTypes.js';
import * as braintrust from 'braintrust';
import { EventEmitter } from 'eventemitter3';

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

export function createTestGraphRunner(opts: {
  openAiKey: string;
  pluginEnv?: Record<string, string | undefined>;
  pluginSettings?: Record<string, Record<string, unknown>>;
}): TrivetGraphRunner {
  return async (project, graphId, inputs) => {
    const processor = new GraphProcessor(project, graphId);
    const resolvedContextValues: Record<string, DataValue> = {};
    const outputs = await processor.processGraph(
      {
        nativeApi: new DummyNativeApi(),
        settings: {
          openAiKey: opts.openAiKey,
          openAiOrganization: '',
          pluginEnv: opts.pluginEnv ?? {},
          pluginSettings: opts.pluginSettings ?? {},
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

  const emitter = new EventEmitter() as unknown as {
    emit: <T extends keyof TrivetEvents>(event: T, data: TrivetEvents[T]) => void;
  };

  const graphsById = keyBy(project.graphs, (g) => g.metadata?.id ?? '');

  const trivetResults: TrivetResults = {
    testSuiteResults: [],
    iterationCount,
  };

  emitter.emit('start', { opts });

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

    const allTestCaseResults: TrivetTestCaseResult[] = [];

    emitter.emit('start-test-suite', { testSuite, testGraph, validationGraph });

    const testSuiteResults: TrivetTestSuiteResult = {
      id: testSuite.id,
      testGraph: testSuite.testGraph,
      validationGraph: testSuite.validationGraph,
      name: testSuite.name ?? 'Test',
      description: testSuite.description ?? 'It should pass.',
      testCaseResults: allTestCaseResults.slice(),
      passing: allTestCaseResults.every((r) => r.passing),
    };

    onUpdate?.({
      ...trivetResults,
      testSuiteResults: [...trivetResults.testSuiteResults, testSuiteResults],
    });

    // let experiment = null;
    // if (opts.setBrainTrustSummary) {
    //   experiment = await braintrust.init(testSuite.name ?? `Test Suite ${testSuite.id}`, {
    //     // TODO: It would be good to include the current user's name
    //     experiment: `trivet-${Date.now()}`,
    //     apiKey: opts.,
    //   });

    //   const summary = await experiment.summarize({ summarizeScores: false });
    //   opts.setBrainTrustSummary?.(testSuite.id, summary);
    // } else {
    //   opts.setBrainTrustSummary?.(testSuite.id, undefined);
    // }

    for (const testCase of testSuite.testCases) {
      const testCaseResults = [];

      emitter.emit('start-test-case', {
        testSuite,
        testCase,
        testGraph,
        validationGraph,
      });
      for (let i = 0; i < iterationCount; i++) {
        let testCaseResult: TrivetTestCaseResult;

        try {
          const resolvedInputs: Record<string, DataValue> = mapValues(testCase.input, inferType);
          const startTime = Date.now();
          const outputs = await runGraph(project, testGraph.metadata!.id!, resolvedInputs);
          const duration = Date.now() - startTime;
          const costOutput = outputs.cost;
          const cost = costOutput && costOutput.type === 'number' ? costOutput.value : 0;

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

          // if (experiment) {
          //   experiment.log({
          //     input: testCase.input,
          //     expected: testCase.expectedOutput,
          //     output: validationInputs.output!.value,
          //     scores: {
          //       ...validationResults.reduce(
          //         (acc, r) => ({
          //           ...acc,
          //           [r.title]: r.valid ? 1 : 0,
          //         }),
          //         {},
          //       ),
          //       no_error: 1,
          //     },
          //     metadata: {
          //       testSuite: testSuite.id,
          //       testCase: testCase.id,
          //       iteration: i + 1,
          //       duration,
          //       passing: validationResults.every((r) => r.valid),
          //       message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
          //       outputs: mapValues(outputs, (dataValue) => dataValue.value),
          //     },
          //   });
          // }

          testCaseResult = {
            id: testCase.id,
            iteration: i + 1,
            passing: validationResults.every((r) => r.valid),
            message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
            outputs: mapValues(omit(outputs, 'cost'), (dataValue) => dataValue.value),
            duration,
            cost,
          };

          testCaseResults.push(testCaseResult);
          allTestCaseResults.push(testCaseResult);
        } catch (err) {
          // if (experiment) {
          //   experiment.log({
          //     input: testCase.input,
          //     expected: testCase.expectedOutput,
          //     output: null,
          //     scores: {
          //       no_error: 0,
          //     },
          //     metadata: {
          //       testSuite: testSuite.id,
          //       testCase: testCase.id,
          //       iteration: i + 1,
          //     },
          //   });
          // }

          testCaseResult = {
            id: testCase.id,
            iteration: i + 1,
            passing: false,
            message: 'An error occurred',
            outputs: {},
            duration: 0,
            cost: 0,
            error: err,
          };

          testCaseResults.push(testCaseResult);
          allTestCaseResults.push(testCaseResult);
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
        existingTestSuite.testCaseResults = allTestCaseResults.slice();
        existingTestSuite.passing = allTestCaseResults.every((r) => r.passing);

        onUpdate?.(cloneDeep(trivetResults));

        emitter.emit('finish-test-case-iteration', {
          testSuite,
          testCase,
          testGraph,
          validationGraph,
          iteration: i,
          result: testCaseResult,
        });
      }
      emitter.emit('finish-test-case', {
        testSuite,
        testCase,
        testGraph,
        validationGraph,
        results: testCaseResults,
      });
    }

    emitter.emit('finish-test-suite', {
      testSuite,
      testGraph,
      validationGraph,
      result: testSuiteResults,
    });

    // if (experiment) {
    //   const summary = await experiment.summarize({ summarizeScores: false });
    //   opts.setBrainTrustSummary?.(testSuite.id, summary);
    // }
  }

  emitter.emit('done', undefined);

  return trivetResults;
}
