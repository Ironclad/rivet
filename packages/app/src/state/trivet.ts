import { type TrivetResults, type TrivetTestSuite } from '@ironclad/trivet';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { createHybridStorage } from './storage.js';

export type TrivetState = {
  testSuites: TrivetTestSuite[];
  selectedTestSuiteId?: string;
  editingTestCaseId?: string;
  recentTestResults?: TrivetResults;
  runningTests: boolean;
};

const { storage } = createHybridStorage('trivet');

// Convert to persisted atom using atomWithStorage
export const trivetState = atomWithStorage<TrivetState>(
  'trivetState',
  {
    testSuites: [],
    runningTests: false,
  },
  storage,
);

// Convert selector to derived atom
export const trivetTestsRunningState = atom((get) => get(trivetState).runningTests);
