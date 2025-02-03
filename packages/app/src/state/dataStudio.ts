import { Dataset, type DatasetId, type DatasetMetadata } from '@ironclad/rivet-core';
import { atom } from 'jotai';

export const datasetsState = atom<DatasetMetadata[]>([]);

export const selectedDatasetState = atom<DatasetId | undefined>(undefined);
