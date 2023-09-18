import { Opaque } from 'type-fest';
import { ProjectId } from '../index.js';

export type DatasetId = Opaque<string, 'DatasetId'>;

export type DatasetMetadata = {
  id: DatasetId;
  projectId: ProjectId;
  name: string;
  description: string;
};

export type Dataset = {
  id: DatasetId;
  rows: DatasetRow[];
};

export type DatasetRow = {
  id: string;

  data: string[];
};

export interface DatasetProvider {
  getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata[]>;

  getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]>;

  getDatasetData(id: DatasetId): Promise<Dataset>;

  putDatasetData(id: DatasetId, data: Dataset): Promise<void>;

  putDatasetMetadata(metadata: DatasetMetadata): Promise<void>;

  clearDatasetData(id: DatasetId): Promise<void>;

  deleteDataset(id: DatasetId): Promise<void>;
}
