import { DataValue, Project, GraphProcessor, GraphId, NativeApi, BaseDir, ReadDirOptions, Settings } from '@ironclad/rivet-core';
import { keyBy } from 'lodash-es';
import { minimatch } from 'minimatch';

export interface TrivetOpts {
  project: Project;
  testGlobs: string[];
  openAiKey: string;
}

export interface TrivetResults {
  testResults: TrivetTestResult[];
}

export interface TrivetTestResult {
  graph: string;
  name: string;
  description: string;
  validationResults: TrivetValidationResult[];
  passing: boolean;
}

export interface TrivetValidationResult {
  id: string;
  title: string;
  description: string;
  valid: boolean;
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
  const { project, testGlobs, openAiKey } = opts;

  const testGraphs = Object.entries(project.graphs).filter(([, g]) => testGlobs.some((glob) => minimatch(g.metadata?.name ?? '', glob)));

  const trivetResults: TrivetResults = {
    testResults: [],
  }

  for (const [graphId, graph] of testGraphs) {
    const processor = new GraphProcessor(project, graphId as GraphId);
    const resolvedInputs: Record<string, DataValue> = {};
    const resolvedContextValues: Record<string, DataValue> = {};
    const nodesById = keyBy(graph.nodes, 'id');
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
    const validationResults = Object.entries(outputs).map(([outputId, result]): TrivetValidationResult => {
      const node = nodesById[outputId];
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
    const testResults: TrivetTestResult = {
      graph: graphId,
      name: graph.metadata?.name ?? 'Test',
      description: graph.metadata?.description ?? 'It should pass.',
      passing: validationResults.every((r) => r.valid),
      validationResults,
    }
    trivetResults.testResults.push(testResults);
  }
  return trivetResults;
}