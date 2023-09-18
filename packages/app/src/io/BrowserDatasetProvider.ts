import { DatasetRow, DatasetId, DatasetMetadata, DatasetProvider, ProjectId, Dataset } from '@ironclad/rivet-core';

export class BrowserDatasetProvider implements DatasetProvider {
  async getDatasetDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const openRequest = window.indexedDB.open('datasets', 2);

      openRequest.onupgradeneeded = () => {
        const database = openRequest.result;
        if (!database.objectStoreNames.contains('datasets')) {
          database.createObjectStore('datasets');
        }

        if (!database.objectStoreNames.contains('data')) {
          database.createObjectStore('data');
        }
      };

      openRequest.onerror = () => {
        reject(openRequest.error);
      };

      openRequest.onsuccess = () => {
        resolve(openRequest.result);
      };
    });
  }

  async getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata[]> {
    const metadataStore = await this.getDatasetDatabase();

    const transaction = metadataStore.transaction('datasets', 'readonly');
    const store = transaction.objectStore('datasets');
    const request = store.get(id);
    return new Promise<DatasetMetadata[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });
  }

  async getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]> {
    const metadataStore = await this.getDatasetDatabase();

    const transaction = metadataStore.transaction('datasets', 'readonly');
    const store = transaction.objectStore('datasets');
    const request = store.getAll();
    return new Promise<DatasetMetadata[]>((resolve, reject) => {
      request.onsuccess = () => {
        const datasets = request.result as DatasetMetadata[];

        return resolve(datasets.filter((d) => d.projectId === projectId));
      };
      request.onerror = reject;
    });
  }

  async getDatasetData(id: DatasetId): Promise<Dataset> {
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readonly');
    const store = transaction.objectStore('data');
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const dataset = request.result as Dataset | null;
        return resolve(
          dataset ?? {
            id,
            rows: [],
          },
        );
      };
      request.onerror = reject;
    });
  }

  async putDatasetData(id: DatasetId, data: Dataset): Promise<void> {
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.delete(id);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });

    const putRequest = store.put(data, id);
    return new Promise<void>((resolve, reject) => {
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = reject;
    });
  }

  async putDatasetMetadata(metadata: DatasetMetadata): Promise<void> {
    const metadataStore = await this.getDatasetDatabase();

    const transaction = metadataStore.transaction('datasets', 'readwrite');
    const store = transaction.objectStore('datasets');
    const request = store.put(metadata, metadata.id);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  }

  async clearDatasetData(id: DatasetId): Promise<void> {
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.delete(id);
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });
  }

  async deleteDataset(id: DatasetId): Promise<void> {
    const metadataStore = await this.getDatasetDatabase();

    const transaction = metadataStore.transaction('datasets', 'readwrite');
    const store = transaction.objectStore('datasets');
    const request = store.delete(id);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = reject;
    });

    const dataStore = await this.getDatasetDatabase();

    const dataTransaction = dataStore.transaction('data', 'readwrite');
    const dataStoreStore = dataTransaction.objectStore('data');
    const dataRequest = dataStoreStore.delete(id);
    await new Promise<void>((resolve, reject) => {
      dataRequest.onsuccess = () => resolve();
      dataRequest.onerror = reject;
    });
  }
}
