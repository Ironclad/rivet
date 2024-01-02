import { atom } from 'recoil';
import { type ArrayDataValue, type NodeId, type ProcessId, type StringDataValue } from '@ironclad/rivet-core';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'userInput' });

export const userInputModalOpenState = atom({
  key: 'userInputModalOpenState',
  default: false,
});

export type ProcessQuestions = {
  nodeId: NodeId;
  processId: ProcessId;
  questions: string[];
};

export const userInputModalQuestionsState = atom<Record<NodeId, ProcessQuestions[]>>({
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
  effects: [persistAtom],
});
