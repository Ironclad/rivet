import { save, open } from '@tauri-apps/api/dialog';
import { writeFile, readTextFile } from '@tauri-apps/api/fs';
import {
  ExecutionRecorder,
  NodeGraph,
  Project,
  deserializeGraph,
  deserializeProject,
  serializeGraph,
  serializeProject,
} from '@ironclad/rivet-core';
import { IOProvider } from './IOProvider.js';
import { isInTauri } from '../utils/tauri.js';
import { TrivetTestSuite, deserializeTestSuites, serializeTestSuites } from '@ironclad/trivet';

const SEPARATOR = '\n======== TRIVET TESTS =========\n';

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

  async saveProjectData(project: Project, testData: TrivetTestSuite[]) {
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

    const data = serializeProject(project) as string;
    const serializedTestData = serializeTestSuites(testData) as string;

    if (filePath) {
      await writeFile({
        // TODO HACK
        contents: testData?.length > 0 ? data + SEPARATOR + serializedTestData : data,
        path: filePath,
      });

      return filePath;
    }

    return undefined;
  }

  async saveProjectDataNoPrompt(project: Project, testData: TrivetTestSuite[], path: string) {
    const data = serializeProject(project) as string;
    const serializedTestData = serializeTestSuites(testData) as string;

    await writeFile({
      // TODO HACK
      contents: testData?.length > 0 ? data + SEPARATOR + serializedTestData : data,
      path: path,
    });
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

  async loadProjectData(callback: (data: { project: Project; testData: TrivetTestSuite[]; path: string }) => void) {
    const path = await open({
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
    });

    if (path) {
      const data = await readTextFile(path as string);
      // TODO HACK
      const [projDataStr, testDataStr] = data.split(SEPARATOR);
      const projectData = deserializeProject(projDataStr);

      let testSuites: TrivetTestSuite[] = [];
      if (testDataStr) {
        testSuites = deserializeTestSuites(testDataStr);
      }
      callback({ project: projectData, testData: testSuites, path: path as string });
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

  async openFile() {
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
        path: path,
      });
    }
  }
}
