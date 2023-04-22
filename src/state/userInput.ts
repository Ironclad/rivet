import { atom } from 'recoil';
import { persistAtom } from './persist';

export const userInputModalOpenState = atom({
  key: 'userInputModalOpenState',
  default: false,
});

export const userInputModalQuestionsState = atom<string[][]>({
  key: 'usetInputModalQuestionsState',
  default: [],
});

export const userInputModalSubmitState = atom<(answers: string[][]) => void>({
  key: 'userInputModalSubmitState',
  default: () => {},
});

export const lastAnswersState = atom<Record<string, string>>({
  key: 'lastAnswers',
  default: {},
  effects_UNSTABLE: [persistAtom],
});
