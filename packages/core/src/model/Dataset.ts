import type { Opaque } from 'type-fest';
import type { ProjectId } from '../index.js';

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

  /** An optional embedding for the row's data. */
  embedding?: number[];
};
