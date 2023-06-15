import { GraphTestId, NodeGraphTest } from '@ironclad/rivet-core';
import { atom } from 'recoil';

interface GraphTesterState {
  isOpen: boolean;
  graphTest?: NodeGraphTest;
  testResults: Record<GraphTestId, GraphTesterResults[]>;
}

export interface GraphTesterResults {
  name: string;
  duration: number;
  testInputIndex: number;
  validationOutput: {
    passed: boolean;
  }[];
}

export const graphTesterState = atom<GraphTesterState>({
  key: 'graphTesterState',
  default: {
    isOpen: false,
    testResults: {},
  },
});
