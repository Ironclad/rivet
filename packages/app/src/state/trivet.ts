import { atom } from 'recoil';
import { TrivetUiTypes } from '../components/trivet/TrivetUiTypes';

export type TrivetState = {
  isOpen: boolean;
  testSuites: TrivetUiTypes.TrivetTestSuiteWithId[];
  selectedTestSuiteId?: string;
  editingTestCaseId?: string;
};

export const trivetState = atom<TrivetState>({
  key: 'trivetState',
  default: {
    isOpen: false,
    testSuites: [
      {
        id: 'ts-1',
        testGraph: 'testGraph',
        validationGraph: 'validationGraph',
        testCases: [
          {
            id: 'tc-1-1',
            inputs: {
              question: 'Find my MNDA with Dutton Ranch',
            },
            baselineOutputs: {
              searchFormula: 'And(Search([counterpartyName], "Dutton Ranch"), Equals([contractType], "MNDA"))',
            },
          },
          {
            id: 'tc-1-2',
            inputs: {
              question: 'Find my contract with the Jets',
            },
            baselineOutputs: {
              searchFormula: 'Search([counterpartyName], "Jets")',
            },
          },
        ],
      },
      {
        id: 'ts-2',
        testGraph: 'testGraph',
        validationGraph: 'validationGraph',
        testCases: [
          {
            id: 'tc-2-1',
            inputs: {},
            baselineOutputs: {},
          },
        ],
      },
    ],
  },
});