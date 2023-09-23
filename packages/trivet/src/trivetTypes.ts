import { type GraphId, type GraphInputs, type GraphOutputs, type Project } from '@ironclad/rivet-core';

export type TrivetGraphRunner = (project: Project, graphId: GraphId, inputs: GraphInputs) => Promise<GraphOutputs>;

export interface TrivetOpts {
  project: Project;
  testSuites: TrivetTestSuite[];

  /** Runs each test in each suite N times. Defaults to just 1. A test passes if all iterations pass. */
  iterationCount?: number;

  runGraph: TrivetGraphRunner;
  onUpdate?: (results: TrivetResults) => void;
}

export interface TrivetTestSuite {
  id: string;
  name?: string;
  description?: string;
  testGraph: string;
  validationGraph: string;
  testCases: TrivetTestCase[];
}

export interface TrivetTestCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}

export interface TrivetResults {
  testSuiteResults: TrivetTestSuiteResult[];
  iterationCount: number;
}

export interface TrivetTestSuiteResult {
  id: string;
  testGraph: string;
  validationGraph: string;
  name: string;
  description: string;
  testCaseResults: TrivetTestCaseResult[];
  passing: boolean;
}

export interface TrivetTestCaseResult {
  id: string;
  iteration: number;
  passing: boolean;
  message: string;
  outputs: Record<string, unknown>;
  duration: number;
  cost: number;
  error?: Error | string | any;
}

export type TrivetData = {
  testSuites: TrivetTestSuite[];
};
