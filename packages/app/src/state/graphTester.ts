import { NodeGraphTest } from '@ironclad/rivet-core';
import { atom } from 'recoil';

interface GraphTesterState {
  isOpen: boolean;
  graphTest?: NodeGraphTest;
  testResults?: GraphTesterResults[];
}

export interface GraphTesterResults {
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
  },
});
