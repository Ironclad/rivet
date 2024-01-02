import { type TrivetResults, type TrivetTestSuite } from '@ironclad/trivet';
import { atom, selector } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'trivet' });

export type TrivetState = {
  testSuites: TrivetTestSuite[];
  selectedTestSuiteId?: string;
  editingTestCaseId?: string;
  recentTestResults?: TrivetResults;
  runningTests: boolean;
};

export const trivetState = atom<TrivetState>({
  key: 'trivetState',
  default: {
    testSuites: [],
    runningTests: false,
  },
  effects: [persistAtom],
});

export const trivetTestsRunningState = selector({
  key: 'trivetTestsRunningState',
  get: ({ get }) => get(trivetState).runningTests,
});
