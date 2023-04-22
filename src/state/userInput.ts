import { atom } from 'recoil';

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
