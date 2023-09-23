import * as yaml from 'yaml';
import { type TrivetData, type TrivetTestCase, type TrivetTestSuite } from '../index.js';

export interface SerializedTrivetTestSuite {
  id: string;
  name?: string;
  description?: string;
  testGraph: string;
  validationGraph: string;
  testCases: SerializedTrivetTestCase[];
}

export interface SerializedTrivetTestCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}

export interface SerializedTrivetData {
  version: 1;
  testSuites: SerializedTrivetTestSuite[];
}

export function serializeTestCase(testCase: TrivetTestCase): SerializedTrivetTestCase {
  return {
    id: testCase.id,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
  };
}

export function deserializeTestCase(data: SerializedTrivetTestCase): TrivetTestCase {
  return {
    id: data.id,
    input: data.input,
    expectedOutput: data.expectedOutput,
  };
}

export function serializeTestSuite(testSuite: TrivetTestSuite): SerializedTrivetTestSuite {
  return {
    id: testSuite.id,
    name: testSuite.name,
    description: testSuite.description,
    testGraph: testSuite.testGraph,
    validationGraph: testSuite.validationGraph,
    testCases: testSuite.testCases.map((testCase) => serializeTestCase(testCase)),
  };
}

export function deserializeTestSuite(data: SerializedTrivetTestSuite): TrivetTestSuite {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    testGraph: data.testGraph,
    validationGraph: data.validationGraph,
    testCases: data.testCases.map((testCase) => deserializeTestCase(testCase)),
  };
}

export function serializeTrivetData(data: TrivetData): SerializedTrivetData {
  return {
    version: 1,
    testSuites: data.testSuites.map((testSuite) => serializeTestSuite(testSuite)),
  };
}

export function deserializeTrivetData(data: SerializedTrivetData): TrivetData {
  if (data.version !== 1) {
    throw new Error(`Unsupported version: ${data.version}`);
  }

  return {
    testSuites: data.testSuites.map((testSuite) => deserializeTestSuite(testSuite)),
  };
}

export function serializeTrivetDataToString(data: TrivetData): string {
  return yaml.stringify(serializeTrivetData(data), null, 2);
}

export function deserializeTrivetDataFromString(data: string): TrivetData {
  return deserializeTrivetData(yaml.parse(data));
}
