import { defaultModelSelectorValue, type ModelSelectorValue } from '../utils/modelSelectorOptions';
import { createHybridStorage } from './storage';
import { atomWithStorage } from 'jotai/utils';

const { storage } = createHybridStorage('ai');

export const selectedAssistModelState = atomWithStorage<ModelSelectorValue>(
  'selectAssistModel',
  defaultModelSelectorValue,
  storage,
);
