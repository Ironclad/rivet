import { atom } from 'recoil';
import { persistAtom } from './persist';
import { ArrayDataValue, NodeId, StringDataValue } from '@ironclad/nodai-core';

export const userInputModalOpenState = atom({
  key: 'userInputModalOpenState',
  default: false,
});

export const userInputModalQuestionsState = atom<Record<NodeId, string[]>>({
  key: 'usetInputModalQuestionsState',
  default: {},
});

export const userInputModalSubmitState = atom<{
  submit: (nodeId: NodeId, answers: ArrayDataValue<StringDataValue>) => void;
}>({
  key: 'userInputModalSubmitState',
  default: { submit: () => {} },
});

export const lastAnswersState = atom<Record<string, string>>({
  key: 'lastAnswers',
  default: {},
  effects_UNSTABLE: [persistAtom],
});
