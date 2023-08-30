import { save, open } from '@tauri-apps/plugin-dialog';
import { writeFile, readTextFile, readBinaryFile } from '@tauri-apps/plugin-fs';
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
import { SerializedTrivetData, TrivetData, deserializeTrivetData, serializeTrivetData } from '@ironclad/trivet';

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
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void) {
    const res = await open({
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

    if (res) {
      const data = await readTextFile(res.path);
      const graphData = deserializeGraph(data);
      callback(graphData);
    }
  }

  async loadProjectData(callback: (data: { project: Project; testData: TrivetData; path: string }) => void) {
    const res = await open({
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

    if (res) {
      const data = await readTextFile(res.path);
      const [projectData, attachedData] = deserializeProject(data);

      const trivetData = attachedData.trivet
        ? deserializeTrivetData(attachedData.trivet as SerializedTrivetData)
        : { testSuites: [] };

      callback({ project: projectData, testData: trivetData, path: res.path });
    }
  }

  async loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void) {
    const res = await open({
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

    if (res) {
      const data = await readTextFile(res.path);
      const recorder = ExecutionRecorder.deserializeFromString(data);
      callback({ recorder, path: res.path });
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

    return path ?? null;
  }

  async openFilePath() {
    const res = await open({
      filters: [],
      multiple: false,
      directory: false,
      recursive: false,
      title: 'Choose File',
    });

    return res?.path ?? null;
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
    const res = await open({
      multiple: false,
    });

    if (res) {
      const contents = await readTextFile(res.path);
      callback(contents);
    }
  }

  async readFileAsBinary(callback: (data: Uint8Array) => void): Promise<void> {
    const res = await open({
      multiple: false,
    });

    if (res) {
      const contents = await readBinaryFile(res.path);
      callback(contents);
    }
  }
}
