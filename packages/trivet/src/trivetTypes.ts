import { GraphId, GraphInputs, GraphOutputs, NodeGraph, Project } from '@ironclad/rivet-core';

import type { ExperimentSummary as BTExperimentSummary } from './plugins/braintrust.js';
import { EventEmitter } from 'eventemitter3';

export type { BTExperimentSummary };

export type TrivetGraphRunner = (project: Project, graphId: GraphId, inputs: GraphInputs) => Promise<GraphOutputs>;

export interface TrivetOpts {
  project: Project;
  testSuites: TrivetTestSuite[];

  /** Runs each test in each suite N times. Defaults to just 1. A test passes if all iterations pass. */
  iterationCount?: number;

  runGraph: TrivetGraphRunner;
  onUpdate?: (results: TrivetResults) => void;

  plugins: TrivetPlugin[];

  // /** If provided, will be used to fetch the BrainTrust summary for each experiment. */
  // setBrainTrustSummary?: (id: string, summary?: BTExperimentSummary) => void;
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

export type TrivetEvents = {
  start: { opts: TrivetOpts };
  done: void;

  'start-test-suite': { testSuite: TrivetTestSuite; testGraph: NodeGraph; validationGraph: NodeGraph };
  'finish-test-suite': {
    testSuite: TrivetTestSuite;
    testGraph: NodeGraph;
    validationGraph: NodeGraph;
    result: TrivetTestSuiteResult;
  };

  'start-test-case': {
    testSuite: TrivetTestSuite;
    testCase: TrivetTestCase;
    testGraph: NodeGraph;
    validationGraph: NodeGraph;
  };
  'finish-test-case': {
    testSuite: TrivetTestSuite;
    testCase: TrivetTestCase;
    testGraph: NodeGraph;
    validationGraph: NodeGraph;
    results: TrivetTestCaseResult[];
  };

  'start-test-case-iteration': {
    testSuite: TrivetTestSuite;
    testCase: TrivetTestCase;
    testGraph: NodeGraph;
    validationGraph: NodeGraph;
    iteration: number;
  };
  'finish-test-case-iteration': {
    testSuite: TrivetTestSuite;
    testCase: TrivetTestCase;
    testGraph: NodeGraph;
    validationGraph: NodeGraph;
    iteration: number;
    result: TrivetTestCaseResult;
  };
};

export type TrivetEventEmitter = {
  on<T extends keyof TrivetEvents>(event: T, listener: (data: TrivetEvents[T]) => void): void;
};

export type TrivetPlugin = {
  id: string;
  name?: string;

  register(trivetEventEmitter: TrivetEventEmitter): void;
};
