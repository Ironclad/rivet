import { writeFile, readTextFile, exists } from '@tauri-apps/api/fs';
import { type Project, deserializeDatasets, serializeDatasets } from '@ironclad/rivet-core';
import { allowDataFileNeighbor } from '../utils/tauri.js';
import { datasetProvider } from '../utils/globals/datasetProvider.js';

export async function saveDatasetsFile(projectFilePath: string, project: Project) {
  await allowDataFileNeighbor(projectFilePath);

  const dataPath = projectFilePath.replace('.rivet-project', '.rivet-data');
  const datasets = await datasetProvider.exportDatasetsForProject(project.metadata.id);

  if (datasets.length > 0 || (await exists(dataPath))) {
    const serializedDatasets = serializeDatasets(datasets);

    await writeFile({
      contents: serializedDatasets,
      path: dataPath,
    });
  }
}

export async function loadDatasetsFile(projectFilePath: string, project: Project) {
  await allowDataFileNeighbor(projectFilePath);

  const datasetsFilePath = projectFilePath.replace('.rivet-project', '.rivet-data');

  const datasetsFileExists = await exists(datasetsFilePath);

  // No data file, so just no datasets
  if (!datasetsFileExists) {
    await datasetProvider.importDatasetsForProject(project.metadata.id, []);
    return;
  }

  const fileContents = await readTextFile(datasetsFilePath);

  const datasets = deserializeDatasets(fileContents);

  await datasetProvider.importDatasetsForProject(project.metadata.id, datasets);
}
