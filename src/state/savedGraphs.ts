import { atom } from 'recoil';
import { NodeGraph } from '../model/NodeGraph';
import { persistAtom } from './persist';

export const savedGraphsState = atom<NodeGraph[]>({
  key: 'savedGraphsState',
  default: [],
  effects_UNSTABLE: [persistAtom],
});
