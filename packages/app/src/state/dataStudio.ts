import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import { Opaque } from 'type-fest';

export type DatasetId = Opaque<string, 'DatasetId'>;

const { persistAtom } = recoilPersist({ key: 'dataStudio' });

export type DatasetMetadata = {
  id: DatasetId;
  name: string;
  description: string;
};

export type Dataset = {
  id: DatasetId;
  data: DatasetData[];
};

export type DatasetData = {
  id: string;

  data: string[];
};

export const datasetsState = atom<Dataset[]>({
  key: 'datasets',
  default: [],
});

export const selectedDatasetState = atom<DatasetId | undefined>({
  key: 'selectedDataset',
  default: undefined,
});
