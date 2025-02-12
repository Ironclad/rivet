import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type ArrayDataValue, type NodeId, type ProcessId, type StringDataValue } from '@ironclad/rivet-core';
import { createHybridStorage } from './storage.js';

const { storage } = createHybridStorage('userInput');

export const userInputModalOpenState = atom<boolean>(false);

export type ProcessQuestions = {
  nodeId: NodeId;
  processId: ProcessId;
  questions: string[];
};

export const userInputModalQuestionsState = atom<Record<NodeId, ProcessQuestions[]>>({});

export const userInputModalSubmitState = atom<{
  submit: (nodeId: NodeId, answers: ArrayDataValue<StringDataValue>) => void;
}>({
  submit: () => {},
});

export const lastAnswersState = atomWithStorage<Record<string, string>>('lastAnswers', {}, storage);
