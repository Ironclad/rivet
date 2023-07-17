import { GraphId, GraphInputs, GraphOutputs, Project } from '@ironclad/rivet-core';

export type TrivetGraphRunner = (project: Project, graphId: GraphId, inputs: GraphInputs) => Promise<GraphOutputs>;

export interface TrivetOpts {
  project: Project;
  testSuites: TrivetTestSuite[];
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
  inputs: Record<string, unknown>;
  baselineOutputs: Record<string, unknown>;
}

export interface TrivetResults {
  testSuiteResults: TrivetTestSuiteResult[];
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
  passing: boolean;
  message: string;
  outputs: Record<string, unknown>;
}

export type TrivetData = {
  testSuites: TrivetTestSuite[];
};
