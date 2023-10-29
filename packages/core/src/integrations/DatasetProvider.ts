import { type Dataset, type DatasetId, type DatasetMetadata, type DatasetRow, type ProjectId } from '../index.js';
import { cloneDeep } from 'lodash-es';
import type { CombinedDataset } from '../utils/index.js';

export interface DatasetProvider {
  getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata | undefined>;

  getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]>;

  getDatasetData(id: DatasetId): Promise<Dataset>;

  putDatasetData(id: DatasetId, data: Dataset): Promise<void>;

  putDatasetRow(id: DatasetId, row: DatasetRow): Promise<void>;

  putDatasetMetadata(metadata: DatasetMetadata): Promise<void>;

  clearDatasetData(id: DatasetId): Promise<void>;

  deleteDataset(id: DatasetId): Promise<void>;

  /** Gets the K nearest neighbor rows to the given vector. */
  knnDatasetRows(datasetId: DatasetId, k: number, vector: number[]): Promise<(DatasetRow & { distance?: number })[]>;

  exportDatasetsForProject(projectId: ProjectId): Promise<CombinedDataset[]>;
}

export class InMemoryDatasetProvider implements DatasetProvider {
  readonly #datasets;

  constructor(datasets: CombinedDataset[]) {
    this.#datasets = datasets;
  }

  async getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata | undefined> {
    const dataset = this.#datasets.find((d) => d.meta.id === id);
    return dataset?.meta;
  }

  async getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]> {
    return this.#datasets.map((d) => d.meta);
  }

  async getDatasetData(id: DatasetId): Promise<Dataset> {
    const dataset = this.#datasets.find((d) => d.meta.id === id);
    if (!dataset) {
      return { id, rows: [] };
    }
    return dataset.data;
  }

  async putDatasetRow(id: DatasetId, row: DatasetRow): Promise<void> {
    const dataset = this.#datasets.find((d) => d.meta.id === id);
    if (!dataset) {
      throw new Error(`Dataset ${id} not found`);
    }

    const existingRow = dataset.data.rows.find((r) => r.id === row.id);
    if (existingRow) {
      existingRow.data = row.data;
      existingRow.embedding = row.embedding;
      return;
    }

    dataset.data.rows.push(row);
  }

  async putDatasetData(id: DatasetId, data: Dataset): Promise<void> {
    const dataset = this.#datasets.find((d) => d.meta.id === id);
    if (!dataset) {
      throw new Error(`Dataset ${id} not found`);
    }

    dataset.data = data;
  }

  async putDatasetMetadata(metadata: DatasetMetadata): Promise<void> {
    const matchingDataset = this.#datasets.find((d) => d.meta.id === metadata.id);

    if (matchingDataset) {
      matchingDataset.meta = metadata;
      return;
    }

    this.#datasets.push({
      meta: metadata,
      data: {
        id: metadata.id,
        rows: [],
      },
    });
  }

  async clearDatasetData(id: DatasetId): Promise<void> {
    const dataset = this.#datasets.find((d) => d.meta.id === id);
    if (!dataset) {
      return;
    }

    dataset.data = {
      id,
      rows: [],
    };
  }

  async deleteDataset(id: DatasetId): Promise<void> {
    const index = this.#datasets.findIndex((d) => d.meta.id === id);
    if (index === -1) {
      return;
    }

    this.#datasets.splice(index, 1);
  }

  async knnDatasetRows(
    datasetId: DatasetId,
    k: number,
    vector: number[],
  ): Promise<(DatasetRow & { distance?: number | undefined })[]> {
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
    // Cloning is safest... but slow
    return cloneDeep(this.#datasets);
  }
}

/** OpenAI embeddings are already normalized, so this is equivalent to cosine similarity */
const dotProductSimilarity = (a: number[], b: number[]): number => {
  return a.reduce((acc, val, i) => acc + val * b[i]!, 0);
};
