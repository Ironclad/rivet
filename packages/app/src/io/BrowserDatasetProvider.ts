import {
  type DatasetRow,
  type DatasetId,
  type DatasetMetadata,
  type DatasetProvider,
  type ProjectId,
  type Dataset,
  type CombinedDataset,
} from '@ironclad/rivet-core';
import { cloneDeep } from 'lodash-es';

export class BrowserDatasetProvider implements DatasetProvider {
  currentProjectId: ProjectId | undefined;
  #currentProjectDatasets: CombinedDataset[] = [];

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

  async loadDatasets(projectId: ProjectId): Promise<void> {
    const db = await this.getDatasetDatabase();

    const store = db.transaction('datasets', 'readonly').objectStore('datasets');

    const metadata: DatasetMetadata[] = [];

    await new Promise<void>((resolve, reject) => {
      const cursorRequest = store.openCursor();
      cursorRequest.onerror = () => {
        reject(cursorRequest.error);
      };
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor?.value) {
          const dataset = cursor.value as DatasetMetadata;
          if (dataset.projectId === projectId) {
            metadata.push(dataset);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    const dataStore = db.transaction('data', 'readonly').objectStore('data');

    const data = await Promise.all(
      metadata.map(async (meta) => {
        const dataset = await toPromise<Dataset | undefined>(dataStore.get(meta.id));
        return dataset;
      }),
    );

    this.currentProjectId = projectId;
    this.#currentProjectDatasets = metadata.map(
      (meta, i): CombinedDataset => ({
        meta,
        data: data[i] ?? {
          id: meta.id,
          rows: [],
        },
      }),
    );
  }

  async getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata | undefined> {
    return this.#currentProjectDatasets.find((d) => d.meta.id === id)?.meta;
  }

  async getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]> {
    if (this.currentProjectId !== projectId) {
      throw new Error('Project not loaded. Call loadDatasets first.');
    }

    return this.#currentProjectDatasets.map((d) => d.meta);
  }

  async getDatasetData(id: DatasetId): Promise<Dataset> {
    return (
      this.#currentProjectDatasets.find((d) => d.meta.id === id)?.data ?? {
        id,
        rows: [],
      }
    );
  }

  async putDatasetData(id: DatasetId, data: Dataset): Promise<void> {
    const dataset = this.#currentProjectDatasets.find((d) => d.meta.id === id);
    if (!dataset) {
      throw new Error(`Dataset ${id} not found`);
    }

    dataset.data = data;

    // Sync the database
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    await toPromise(store.put(data, id));
  }

  async putDatasetRow(id: DatasetId, row: DatasetRow): Promise<void> {
    const dataset = this.#currentProjectDatasets.find((d) => d.meta.id === id);
    if (!dataset) {
      throw new Error(`Dataset ${id} not found`);
    }

    const existingRow = dataset.data.rows.find((r) => r.id === row.id);
    if (existingRow) {
      existingRow.data = row.data;
      existingRow.embedding = row.embedding;
    } else {
      dataset.data.rows.push(row);
    }

    // Sync the database
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    await toPromise(store.put(dataset.data, id));
  }

  async putDatasetMetadata(metadata: DatasetMetadata): Promise<void> {
    const matchingDataset = this.#currentProjectDatasets.find((d) => d.meta.id === metadata.id);

    if (matchingDataset) {
      matchingDataset.meta = metadata;
    } else {
      this.#currentProjectDatasets.push({
        meta: metadata,
        data: {
          id: metadata.id,
          rows: [],
        },
      });
    }

    // Sync the database
    const metadataStore = await this.getDatasetDatabase();

    const transaction = metadataStore.transaction('datasets', 'readwrite');
    const store = transaction.objectStore('datasets');
    await toPromise(store.put(metadata, metadata.id));
  }

  async clearDatasetData(id: DatasetId): Promise<void> {
    const dataset = this.#currentProjectDatasets.find((d) => d.meta.id === id);
    if (!dataset) {
      return;
    }

    dataset.data = {
      id,
      rows: [],
    };

    // Sync the database
    const dataStore = await this.getDatasetDatabase();

    const transaction = dataStore.transaction('data', 'readwrite');
    const store = transaction.objectStore('data');
    await toPromise(store.delete(id));
  }

  async deleteDataset(id: DatasetId): Promise<void> {
    const index = this.#currentProjectDatasets.findIndex((d) => d.meta.id === id);
    if (index === -1) {
      return;
    }

    this.#currentProjectDatasets.splice(index, 1);

    // Sync the database
    const metadataStore = await this.getDatasetDatabase();

    const metaTxn = metadataStore.transaction('datasets', 'readwrite');
    const store = metaTxn.objectStore('datasets');
    await toPromise(store.delete(id));

    const dataStore = await this.getDatasetDatabase();

    const dataTxn = dataStore.transaction('data', 'readwrite');
    const dataStoreStore = dataTxn.objectStore('data');
    await toPromise(dataStoreStore.delete(id));
  }

  async knnDatasetRows(
    datasetId: DatasetId,
    k: number,
    vector: number[],
  ): Promise<(DatasetRow & { distance?: number })[]> {
    const allRows = await this.getDatasetData(datasetId);

    const sorted = allRows.rows
      .filter((row) => row.embedding != null)
      .map((row) => ({
        row,
        similarity: dotProductSimilarity(vector, row.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return sorted.slice(0, k).map((r) => ({ ...r.row, distance: r.similarity }));
  }

  async exportDatasetsForProject(_projectId: ProjectId): Promise<CombinedDataset[]> {
    return cloneDeep(this.#currentProjectDatasets);
  }

  async importDatasetsForProject(projectId: ProjectId, datasets: CombinedDataset[]) {
    this.#currentProjectDatasets = datasets;
    this.currentProjectId = projectId;

    const db = await this.getDatasetDatabase();
    const transaction = db.transaction(['datasets', 'data'], 'readwrite');

    const metadataStore = transaction.objectStore('datasets');
    const dataStore = transaction.objectStore('data');

    await Promise.all(
      datasets.map(async (dataset) => {
        await Promise.all([
          toPromise(metadataStore.put(dataset.meta, dataset.meta.id)),
          toPromise(dataStore.put(dataset.data, dataset.data.id)),
        ]);
      }),
    );
  }
}

/** OpenAI embeddings are already normalized, so this is equivalent to cosine similarity */
const dotProductSimilarity = (a: number[], b: number[]): number => {
  return a.reduce((acc, val, i) => acc + val * b[i]!, 0);
};

function toPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
