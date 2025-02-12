import { getError } from '@ironclad/rivet-core';
import { createJSONStorage } from 'jotai/utils';
import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage';
import prettyBytes from 'pretty-bytes';
import { toast } from 'react-toastify';
import { debounce } from 'lodash-es';

// In-memory storage that acts as a buffer
const memoryStorage = new Map<string, any>();

// Interface for the actual storage backend
interface AsyncStorageBackend {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// IndexedDB implementation example
class IndexedDBStorage implements AsyncStorageBackend {
  private dbName = 'jotai-store';
  private storeName = 'state';
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.storeName);
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Create the hybrid storage
export const createHybridStorage = (
  mainKey?: string,
  asyncStorage: AsyncStorageBackend = new IndexedDBStorage(),
): {
  storage: SyncStorage<any>;
} => {
  const jsonStorage = createJSONStorage<any>(() => localStorage);

  // Debounced save function to avoid too frequent writes
  const debouncedSave = debounce(async (key: string, value: any) => {
    try {
      await asyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to async storage:', e);
      toast.error(`Error saving to persistent storage: ${e}`);
    }
  }, 1000);

  const storage: SyncStorage<any> = {
    getItem: (key: string, initialValue) => {
      if (!mainKey) {
        return memoryStorage.get(key) ?? initialValue;
      }
      const mainObject = memoryStorage.get(mainKey) ?? {};
      return mainObject[key] ?? initialValue;
    },
    setItem: (key: string, value): void => {
      try {
        if (!mainKey) {
          memoryStorage.set(key, value);
          debouncedSave(key, value);
          return;
        }

        const mainObject = memoryStorage.get(mainKey) ?? {};
        mainObject[key] = value;
        memoryStorage.set(mainKey, mainObject);
        debouncedSave(mainKey, mainObject);
      } catch (e) {
        const err = getError(e);
        toast.error(`Error setting storage item: ${err}`);
      }
    },
    removeItem: (key: string): void => {
      if (!mainKey) {
        memoryStorage.delete(key);
        asyncStorage.removeItem(key).catch(console.error);
        return;
      }

      const mainObject = memoryStorage.get(mainKey) ?? {};
      delete mainObject[key];
      memoryStorage.set(mainKey, mainObject);
      debouncedSave(mainKey, mainObject);
    },
  };

  // Initialize function to load data from async storage with localStorage fallback
  const initializeStore = async () => {
    try {
      if (!mainKey) {
        // Load all individual keys
        // You might need a way to know all possible keys here
        return;
      }

      // Try loading from IndexedDB first
      const storedData = await asyncStorage.getItem(mainKey);

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        memoryStorage.set(mainKey, parsedData);
      } else {
        // Fallback to localStorage if data doesn't exist in IndexedDB
        try {
          const localData = jsonStorage.getItem(mainKey, null);
          if (localData) {
            console.log('Migrating data from localStorage to IndexedDB...');
            memoryStorage.set(mainKey, localData);
            // Save to async storage
            await asyncStorage.setItem(mainKey, JSON.stringify(localData));
            console.log('Migration complete');

            // Optionally, clear localStorage to free up space
            // Uncomment if you want to clear after successful migration
            // localStorage.removeItem(mainKey);
          }
        } catch (localError) {
          console.error('Error reading from localStorage:', localError);
        }
      }
    } catch (e) {
      console.error('Error initializing store:', e);
      toast.error(`Error loading persistent storage: ${e}`);

      // If IndexedDB fails completely, fall back to localStorage
      try {
        const localData = jsonStorage.getItem(mainKey!, null);
        if (localData) {
          memoryStorage.set(mainKey!, localData);
          console.warn('Failed to load from IndexedDB, using localStorage data');
        }
      } catch (localError) {
        console.error('Error reading from localStorage:', localError);
      }
    }
  };

  allInitializeStoreFns.add(initializeStore);

  return { storage };
};

export const allInitializeStoreFns = new Set<() => Promise<void>>();
