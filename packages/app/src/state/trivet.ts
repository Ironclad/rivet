import { TrivetResults, TrivetTestSuite } from '@ironclad/trivet';
import { atom } from 'recoil';

export type TrivetState = {
  isOpen: boolean;
  testSuites: TrivetTestSuite[];
  selectedTestSuiteId?: string;
  editingTestCaseId?: string;
  recentTestResults?: TrivetResults;
  runningTests: boolean;
};

export const trivetState = atom<TrivetState>({
  key: 'trivetState',
  default: {
    isOpen: false,
    testSuites: [],
    runningTests: false,
  },
});