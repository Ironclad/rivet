import { InMemoryDatasetProvider, deserializeDatasets } from '@ironclad/rivet-core';
import { readFile } from 'node:fs/promises';

export class NodeDatasetProvider extends InMemoryDatasetProvider {
  static async fromDatasetsFile(datasetsFilePath: string): Promise<NodeDatasetProvider> {
    try {
      const fileContents = await readFile(datasetsFilePath, 'utf8');
      const datasets = deserializeDatasets(fileContents);
      return new NodeDatasetProvider(datasets);
    } catch (err) {
      // No data file, so just no datasets
      if ((err as any).code === 'ENOENT') {
        return new NodeDatasetProvider([]);
      }

      throw err;
    }
  }

  static async fromProjectFile(projectFilePath: string): Promise<NodeDatasetProvider> {
    const dataFilePath = projectFilePath.replace(/\.rivet-project$/, '.rivet-data');
    return NodeDatasetProvider.fromDatasetsFile(dataFilePath);
  }
}
