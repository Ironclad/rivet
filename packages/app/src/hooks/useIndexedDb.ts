import { useEffect, useRef } from 'react';

function useIndexedDb<T = unknown>(options: { dbName: string; storeName: string; version?: number }) {
  const { dbName, storeName, version = 1 } = options;

  const db = useRef<IDBDatabase>();
  const dbLoadedPromise = useRef<Promise<void>>();

  useEffect(() => {
    dbLoadedPromise.current = new Promise((resolve, reject) => {
      const openRequest = window.indexedDB.open(dbName, version);

      openRequest.onupgradeneeded = () => {
        const database = openRequest.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };

      openRequest.onerror = () => {
        reject(openRequest.error);
      };

      openRequest.onsuccess = () => {
        db.current = openRequest.result;
        resolve();
      };
    });

    return () => {
      db.current?.close();
      db.current = undefined;
      dbLoadedPromise.current = undefined;
    };
  }, [dbName, storeName, version]);

  const put = async (key: IDBValidKey, value: T) => {
    await dbLoadedPromise.current;
    const transaction = db.current!.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  };

  const get = async (key: IDBValidKey) => {
    await dbLoadedPromise.current;
    const transaction = db.current!.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  };

  const getAll = async () => {
    await dbLoadedPromise.current;
    const transaction = db.current!.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    return new Promise<T[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  };

  const clear = async () => {
    await dbLoadedPromise.current;
    const transaction = db.current!.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  };

  const del = async (key: IDBValidKey) => {
    await dbLoadedPromise.current;
    const transaction = db.current!.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  };

  return {
    put,
    get,
    getAll,
    clear,
    delete: del,
    loaded: !!db.current,
  };
}

export default useIndexedDb;
