import { type DataId } from '@ironclad/rivet-core';
import { useEffect, useRef, useState } from 'react';

export function useStaticDataDatabase() {
  const database = useRef<IDBDatabase>();
  const databaseLoadedPromise = useRef<Promise<void>>();

  useEffect(() => {
    databaseLoadedPromise.current = new Promise((resolve, reject) => {
      const openRequest = window.indexedDB.open('rivet_static_data', 2);

      openRequest.onupgradeneeded = (event) => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };

      openRequest.addEventListener('error', (event) => {
        reject(openRequest.error);
      });

      openRequest.addEventListener('success', (event) => {
        database.current = openRequest.result;
        resolve();
      });
    });
  }, []);

  const insert = async (id: DataId, data: unknown) => {
    await databaseLoadedPromise.current;
    const transaction = database.current!.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.add({ id, data }, id);
    await new Promise((resolve, reject) => {
      request.addEventListener('success', resolve);
      request.addEventListener('error', reject);
    });
  };

  const get = async (id: DataId) => {
    await databaseLoadedPromise.current;
    const transaction = database.current!.transaction('data', 'readonly');
    const store = transaction.objectStore('data');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.addEventListener('success', () => {
        resolve(request.result);
      });
      request.addEventListener('error', reject);
    });
  };

  const getAll = async () => {
    await databaseLoadedPromise.current;
    const transaction = database.current!.transaction('data', 'readonly');
    const store = transaction.objectStore('data');
    const request = store.getAll() as IDBRequest<{ id: DataId; data: string }[]>;
    return new Promise<{ id: DataId; data: string }[]>((resolve, reject) => {
      request.addEventListener('success', () => {
        resolve(request.result);
      });
      request.addEventListener('error', reject);
    });
  };

  const clear = async () => {
    await databaseLoadedPromise.current;
    const transaction = database.current!.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.clear();
    await new Promise((resolve, reject) => {
      request.addEventListener('success', resolve);
      request.addEventListener('error', reject);
    });
  };

  return {
    insert,
    get,
    getAll,
    clear,
    loaded: !!database.current,
  };
}
