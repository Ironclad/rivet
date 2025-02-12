import { createJSONStorage } from 'jotai/utils';
import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

export const createStorage = (mainKey?: string): SyncStorage<any> => {
  const storage = createJSONStorage<any>(() => localStorage);

  if (!mainKey) {
    return storage;
  }

  return {
    getItem: (key: string, initialValue) => {
      const mainObject = storage.getItem(mainKey, {});
      return mainObject[key] ?? initialValue;
    },
    setItem: (key: string, value): void => {
      const mainObject = storage.getItem(mainKey, {});
      mainObject[key] = value;
      storage.setItem(mainKey, mainObject);
    },
    removeItem: (key: string): void => {
      const mainObject = storage.getItem(mainKey, {});
      delete mainObject[key];
      storage.setItem(mainKey, mainObject);
    },
  };
};
