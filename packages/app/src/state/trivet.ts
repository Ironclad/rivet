import { TrivetResults, TrivetTestSuite } from '@ironclad/trivet';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'trivet' });

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
  effects_UNSTABLE: [persistAtom],
});
