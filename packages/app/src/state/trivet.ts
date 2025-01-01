import { type TrivetResults, type TrivetTestSuite } from '@ironclad/trivet';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type TrivetState = {
  testSuites: TrivetTestSuite[];
  selectedTestSuiteId?: string;
  editingTestCaseId?: string;
  recentTestResults?: TrivetResults;
  runningTests: boolean;
};

// Convert to persisted atom using atomWithStorage
export const trivetState = atomWithStorage<TrivetState>('trivet', {
  testSuites: [],
  runningTests: false,
});

// Convert selector to derived atom
export const trivetTestsRunningState = atom((get) => get(trivetState).runningTests);
