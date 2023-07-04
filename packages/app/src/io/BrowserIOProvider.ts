import {
  NodeGraph,
  Project,
  ExecutionRecorder,
  deserializeGraph,
  deserializeProject,
  serializeGraph,
  serializeProject,
} from '@ironclad/rivet-core';
import { IOProvider } from './IOProvider';

export class BrowserIOProvider implements IOProvider {
  static isSupported(): boolean {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
  }

  async saveGraphData(graphData: NodeGraph): Promise<void> {
    const fileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: 'Rivet Graph',
          accept: {
            'application/json': ['.rivet-graph'],
          },
        },
      ],
    });
    const writable = await fileHandle.createWritable();
    await writable.write(serializeGraph(graphData) as string);
    await writable.close();
  }

  async saveProjectData(project: Project): Promise<string | undefined> {
    const fileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: 'Rivet Project',
          accept: {
            'application/json': ['.rivet-project'],
          },
        },
      ],
    });
    const writable = await fileHandle.createWritable();
    await writable.write(serializeProject(project) as string);
    await writable.close();
    return fileHandle.name;
  }

  async saveProjectDataNoPrompt(project: Project, path: string): Promise<void> {
    throw new Error('Function not supported in the browser');
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Rivet Graph',
          accept: {
            'application/json': ['.rivet-graph'],
          },
        },
      ],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback(deserializeGraph(text));
  }

  async loadProjectData(callback: (data: { project: Project; path: string }) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Rivet Project',
          accept: {
            'application/json': ['.rivet-project'],
          },
        },
      ],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback({ project: deserializeProject(text), path: fileHandle.name });
  }

  async loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Rivet Recording',
          accept: {
            'application/json': ['.rivet-recording'],
          },
        },
      ],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback({ recorder: ExecutionRecorder.deserializeFromString(text), path: fileHandle.name });
  }

  async openDirectory(): Promise<string | string[] | null> {
    const dirHandle = await window.showDirectoryPicker();
    return dirHandle.name;
  }

  async openFile(): Promise<string> {
    const [fileHandle] = await window.showOpenFilePicker();
    return fileHandle.name;
  }
}
