import { Opaque } from 'type-fest';
import { Dataset, DatasetId, DatasetMetadata, DatasetRow, ProjectId } from '../index.js';

export interface DatasetProvider {
  getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata[]>;

  getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]>;

  getDatasetData(id: DatasetId): Promise<Dataset>;

  putDatasetData(id: DatasetId, data: Dataset): Promise<void>;

  putDatasetMetadata(metadata: DatasetMetadata): Promise<void>;

  clearDatasetData(id: DatasetId): Promise<void>;

  deleteDataset(id: DatasetId): Promise<void>;

  /** Gets the K nearest neighbor rows to the given vector. */
  knnDatasetRows(datasetId: DatasetId, k: number, vector: number[]): Promise<(DatasetRow & { distance?: number })[]>;
}
