import { DataValue, Project, GraphProcessor, GraphId, NativeApi, BaseDir, ReadDirOptions, Settings, GraphOutputNode, coerceType, inferType } from '@ironclad/rivet-core';
import { keyBy, mapValues } from 'lodash-es';

export interface TrivetOpts {
  project: Project;
  openAiKey: string;
  testSuites: TrivetTestSuite[];
}

export interface TrivetTestSuite {
  name?: string;
  description?: string;
  testGraph: string;
  validationGraph: string;
  testCases: TrivetTestCase[];
}

export interface TrivetTestCase {
  inputs: Record<string, unknown>;
  baselineOutputs: Record<string, unknown>;
}

export interface TrivetResults {
  testSuiteResults: TrivetTestSuiteResult[];
}

export interface TrivetTestSuiteResult {
  testGraph: string;
  validationGraph: string;
  name: string;
  description: string;
  testCaseResults: TrivetTestCaseResult[];
  passing: boolean;
}

export interface TrivetTestCaseResult {
  passing: boolean;
  message: string;
}

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

export async function runTrivet(opts: TrivetOpts): Promise<TrivetResults> {
  const { project, testSuites, openAiKey } = opts;

  const graphsById = keyBy(project.graphs, (g) => g.metadata?.id ?? '');

  const trivetResults: TrivetResults = {
    testSuiteResults: [],
  }

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

    const validationOutputNodesById = keyBy(validationGraph.nodes.filter((n): n is GraphOutputNode => n.type === 'graphOutput'), (n) => n.data.id);

    const testCaseResults: TrivetTestCaseResult[] = [];

    for (const testCase of testSuite.testCases) {
      const processor = new GraphProcessor(project, testGraph.metadata!.id!);
      const resolvedInputs: Record<string, DataValue> = mapValues(testCase.inputs, inferType);
      const resolvedContextValues: Record<string, DataValue> = {};
      const outputs = await processor.processGraph(
        {
          nativeApi: new DummyNativeApi(),
          settings: {
            openAiKey,
            openAiOrganization: '',
            pineconeApiKey: '',
          } satisfies Required<Settings>,
        },
        resolvedInputs,
        resolvedContextValues,
      );

      console.log('ran test graph', outputs);

      const validationProcessor = new GraphProcessor(project, validationGraph.metadata!.id!);
      const validationInputs: Record<string, DataValue> = {
        input: {
          type: 'object',
          value: testCase.inputs,
        },
        baselineOutput: {
          type: 'object',
          value: testCase.baselineOutputs,
        },
        output: {
          type: 'object',
          value: mapValues(outputs, (dataValue) => dataValue.value),
        }
      }

      console.log('runnign validation graph', validationInputs);

      const validationOutputs = await validationProcessor.processGraph(
        {
          nativeApi: new DummyNativeApi(),
          settings: {
            openAiKey,
            openAiOrganization: '',
            pineconeApiKey: '',
          } satisfies Required<Settings>,
        },
        validationInputs,
        resolvedContextValues,
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
        passing: validationResults.every((r) => r.valid),
        message: validationResults.find((r) => !r.valid)?.description ?? 'PASS',
      });
    }
    trivetResults.testSuiteResults.push({
      testGraph: testSuite.testGraph,
      validationGraph: testSuite.validationGraph,
      name: testGraph.metadata?.name ?? 'Test',
      description: testGraph.metadata?.description ?? 'It should pass.',
      testCaseResults,
      passing: testCaseResults.every((r) => r.passing),
    });
  }
  return trivetResults;
}
