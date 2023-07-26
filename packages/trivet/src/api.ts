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
import { keyBy, mapValues } from 'lodash-es';
import { TrivetGraphRunner, TrivetOpts, TrivetResults, TrivetTestCaseResult } from './trivetTypes.js';

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

export function createTestGraphRunner(opts: { openAiKey: string }): TrivetGraphRunner {
  return async (project, graphId, inputs) => {
    const processor = new GraphProcessor(project, graphId);
    const resolvedContextValues: Record<string, DataValue> = {};
    const outputs = await processor.processGraph(
      {
        nativeApi: new DummyNativeApi(),
        settings: {
          openAiKey: opts.openAiKey,
          openAiOrganization: '',
          pineconeApiKey: '',
          anthropicApiKey: '',
        } satisfies Required<Settings>,
      },
      inputs,
      resolvedContextValues,
    );
    return outputs;
  };
}

export async function runTrivet(opts: TrivetOpts): Promise<TrivetResults> {
  const { project, testSuites, runGraph, onUpdate } = opts;

  const graphsById = keyBy(project.graphs, (g) => g.metadata?.id ?? '');

  const trivetResults: TrivetResults = {
    testSuiteResults: [],
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
      try {

        const resolvedInputs: Record<string, DataValue> = mapValues(testCase.input, inferType);
        const outputs = await runGraph(project, testGraph.metadata!.id!, resolvedInputs);
  
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
  
        const validationOutputs = await runGraph(project, validationGraph.metadata!.id!, validationInputs);
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
          passing: validationResults.every((r) => r.valid),
          message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
          outputs: mapValues(outputs, (dataValue) => dataValue.value),
        });
      } catch (err) {
        testCaseResults.push({
          id: testCase.id,
          passing: false,
          message: 'An error occurred',
          outputs: {},
          error: err,
        });
      }
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
    }
    trivetResults.testSuiteResults.push({
      id: testSuite.id,
      testGraph: testSuite.testGraph,
      validationGraph: testSuite.validationGraph,
      name: testSuite.name ?? 'Test',
      description: testSuite.description ?? 'It should pass.',
      testCaseResults,
      passing: testCaseResults.every((r) => r.passing),
    });
  }
  return trivetResults;
}
