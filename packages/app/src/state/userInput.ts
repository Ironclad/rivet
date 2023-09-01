import { atom } from 'recoil';
import { DataValue, NodeId, ProcessId } from '@ironclad/rivet-core';
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
  submit: (nodeId: NodeId, answers: DataValue) => void;
}>({
  key: 'userInputModalSubmitState',
  default: { submit: () => {} },
});

export const lastAnswersState = atom<Record<string, string>>({
  key: 'lastAnswers',
  default: {},
  effects_UNSTABLE: [persistAtom],
});
