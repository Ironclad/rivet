import { save, open } from '@tauri-apps/api/dialog';
import { writeFile, readTextFile, readBinaryFile, exists } from '@tauri-apps/api/fs';
import {
  CombinedDataset,
  DatasetProvider,
  ExecutionRecorder,
  NodeGraph,
  Project,
  ProjectId,
  deserializeDatasets,
  deserializeGraph,
  deserializeProject,
  serializeDatasets,
  serializeGraph,
  serializeProject,
} from '@ironclad/rivet-core';
import { IOProvider } from './IOProvider.js';
import { allowDataFileNeighbor, isInTauri } from '../utils/tauri.js';
import { SerializedTrivetData, TrivetData, deserializeTrivetData, serializeTrivetData } from '@ironclad/trivet';
import { datasetProvider } from '../utils/globals';

export class TauriIOProvider implements IOProvider {
  static isSupported(): boolean {
    return isInTauri();
  }

  async saveGraphData(graphData: NodeGraph) {
    const filePath = await save({
      filters: [
        {
          name: 'Rivet Graph',
          extensions: ['rivet-graph'],
        },
      ],
      title: 'Save graph',
      defaultPath: `${graphData.metadata?.name ?? 'graph'}.rivet-graph`,
    });

    const data = serializeGraph(graphData) as string;

    if (filePath) {
      await writeFile({
        contents: data,
        path: filePath,
      });
    }
  }

  async saveProjectData(project: Project, testData: TrivetData) {
    const filePath = await save({
      filters: [
        {
          name: 'Rivet Project',
          extensions: ['rivet-project'],
        },
      ],
      title: 'Save project',
      defaultPath: `${project.metadata?.title ?? 'project'}.rivet-project`,
    });

    const data = serializeProject(project, {
      trivet: serializeTrivetData(testData),
    }) as string;

    if (filePath) {
      await writeFile({
        contents: data,
        path: filePath,
      });

      await saveDatasetsFile(filePath, project);

      return filePath;
    }

    return undefined;
  }

  async saveProjectDataNoPrompt(project: Project, testData: TrivetData, path: string) {
    const data = serializeProject(project, {
      trivet: serializeTrivetData(testData),
    }) as string;

    await writeFile({
      contents: data,
      path,
    });

    await saveDatasetsFile(path, project);
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void) {
    const path = await open({
      filters: [
        {
          name: 'Rivet Graph',
          extensions: ['rivet-graph'],
        },
      ],
      multiple: false,
      directory: false,
      recursive: false,
      title: 'Open graph',
    });

    if (path) {
      const data = await readTextFile(path as string);
      const graphData = deserializeGraph(data);
      callback(graphData);
    }
  }

  async loadProjectData(callback: (data: { project: Project; testData: TrivetData; path: string }) => void) {
    const path = (await open({
      filters: [
        {
          name: 'Rivet Project',
          extensions: ['rivet-project'],
        },
      ],
      multiple: false,
      directory: false,
      recursive: false,
      title: 'Open graph',
    })) as string | undefined;

    if (path) {
      const data = await readTextFile(path);
      const [projectData, attachedData] = deserializeProject(data);

      const trivetData = attachedData.trivet
        ? deserializeTrivetData(attachedData.trivet as SerializedTrivetData)
        : { testSuites: [] };

      await loadDatasetsFile(path, projectData);

      callback({ project: projectData, testData: trivetData, path });
    }
  }

  async loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void) {
    const path = await open({
      filters: [
        {
          name: 'Rivet Recording',
          extensions: ['rivet-recording'],
        },
      ],
      multiple: false,
      directory: false,
      recursive: false,
      title: 'Open recording',
    });

    if (path) {
      const data = await readTextFile(path as string);
      const recorder = ExecutionRecorder.deserializeFromString(data);
      callback({ recorder, path: path as string });
    }
  }

  async openDirectory() {
    const path = await open({
      filters: [],
      multiple: false,
      directory: true,
      recursive: true,
      title: 'Choose Directory',
    });

    return path;
  }

  async openFilePath() {
    const path = await open({
      filters: [],
      multiple: false,
      directory: false,
      recursive: false,
      title: 'Choose File',
    });

    return path as string;
  }

  async saveString(content: string, defaultFileName: string) {
    const path = await save({
      filters: [],
      title: 'Save File',
      defaultPath: defaultFileName,
    });

    if (path) {
      await writeFile({
        contents: content,
        path,
      });
    }
  }

  async readFileAsString(callback: (data: string) => void): Promise<void> {
    const path = await open({
      multiple: false,
    });

    if (path) {
      const contents = await readTextFile(path as string);
      callback(contents);
    }
  }

  async readFileAsBinary(callback: (data: Uint8Array) => void): Promise<void> {
    const path = await open({
      multiple: false,
    });

    if (path) {
      const contents = await readBinaryFile(path as string);
      callback(contents);
    }
  }

  async readPathAsString(path: string): Promise<string> {
    const contents = await readTextFile(path);
    return contents;
  }

  async readPathAsBinary(path: string): Promise<Uint8Array> {
    const contents = await readBinaryFile(path);
    return contents;
  }
}

async function saveDatasetsFile(projectFilePath: string, project: Project) {
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

async function loadDatasetsFile(projectFilePath: string, project: Project) {
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
