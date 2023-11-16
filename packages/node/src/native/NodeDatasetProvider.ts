import {
  InMemoryDatasetProvider,
  deserializeDatasets,
  type CombinedDataset,
  type Dataset,
  type DatasetId,
  type ProjectId,
  serializeDatasets,
  type DatasetMetadata,
  type DatasetRow,
} from '@ironclad/rivet-core';
import { readFile, writeFile } from 'node:fs/promises';

export type NodeDatasetProviderOptions = {
  /**
   * If true, then modifications to the dataset during graph execution will save to the file that the dataset was loaded from.
   * Saves will happen after each modification, so this option should only be used for small datasets.
   */
  save?: boolean;

  /**
   * If true, then the dataset file must exist already, and will error if it does not. If false (default),
   * then the dataset file will be created if it doesn't exist.
   */
  requireFile?: boolean;
};

export class NodeDatasetProvider extends InMemoryDatasetProvider {
  readonly #save;
  readonly #filePath;

  constructor(datasets: CombinedDataset[], options: { filePath?: string; save?: boolean } = {}) {
    super(datasets);
    const { save = false, filePath } = options;

    this.#filePath = filePath;
    this.#save = save;

    if (save && !filePath) {
      throw new Error('Cannot save datasets without a file path');
    }
  }

  static async fromDatasetsFile(
    datasetsFilePath: string,
    options: NodeDatasetProviderOptions = {},
  ): Promise<NodeDatasetProvider> {
    try {
      const fileContents = await readFile(datasetsFilePath, 'utf8');
      const datasets = deserializeDatasets(fileContents);
      return new NodeDatasetProvider(datasets, {
        save: options.save,
        filePath: datasetsFilePath,
      });
    } catch (err) {
      const { requireFile = false } = options;

      // No data file, so just no datasets
      if ((err as any).code === 'ENOENT') {
        if (requireFile) {
          throw new Error(`No datasets file found at ${datasetsFilePath}`);
        } else {
          return new NodeDatasetProvider([], {
            save: options.save,
            filePath: datasetsFilePath,
          });
        }
      }

      throw err;
    }
  }

  static async fromProjectFile(
    projectFilePath: string,
    options: NodeDatasetProviderOptions = {},
  ): Promise<NodeDatasetProvider> {
    const dataFilePath = projectFilePath.replace(/\.rivet-project$/, '.rivet-data');
    return NodeDatasetProvider.fromDatasetsFile(dataFilePath, options);
  }

  async save() {
    if (!this.#save) {
      return;
    }

    const exported = await this.exportDatasetsForProject('' as ProjectId);
    const serialized = serializeDatasets(exported);

    if (!this.#filePath) {
      throw new Error('Cannot save datasets without a file path');
    }

    await writeFile(this.#filePath, serialized, 'utf8');
  }

  async putDatasetData(id: DatasetId, data: Dataset): Promise<void> {
    await super.putDatasetData(id, data);
    await this.save();
  }

  async putDatasetMetadata(metadata: DatasetMetadata): Promise<void> {
    await super.putDatasetMetadata(metadata);
    await this.save();
  }

  async putDatasetRow(id: DatasetId, row: DatasetRow): Promise<void> {
    await super.putDatasetRow(id, row);
    await this.save();
  }

  async clearDatasetData(id: DatasetId): Promise<void> {
    await super.clearDatasetData(id);
    await this.save();
  }

  async deleteDataset(id: DatasetId): Promise<void> {
    await super.deleteDataset(id);
    await this.save();
  }
}
