import { createJSONStorage } from 'jotai/utils';
import type { AsyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

export const createStorage = (mainKey: string): AsyncStorage<any> => {
  const storage = createJSONStorage<any>(() => localStorage);

  return {
    getItem: async (key: string, initialValue) => {
      const mainObject = storage.getItem(mainKey, {});
      return mainObject[key] ?? initialValue;
    },
    setItem: async (key: string, value): Promise<void> => {
      const mainObject = storage.getItem(mainKey, {});
      mainObject[key] = value;
      storage.setItem(mainKey, mainObject);
    },
    removeItem: async (key: string): Promise<void> => {
      const mainObject = storage.getItem(mainKey, {});
      delete mainObject[key];
      storage.setItem(mainKey, mainObject);
    },
  };
};
