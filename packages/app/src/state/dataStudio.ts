import { Dataset, type DatasetId, type DatasetMetadata } from '@ironclad/rivet-core';
import { atom } from 'recoil';

export const datasetsState = atom<DatasetMetadata[]>({
  key: 'datasets',
  default: [],
});

export const selectedDatasetState = atom<DatasetId | undefined>({
  key: 'selectedDataset',
  default: undefined,
});
