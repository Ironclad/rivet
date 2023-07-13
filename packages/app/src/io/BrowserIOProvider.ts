import {
  NodeGraph,
  Project,
  ExecutionRecorder,
  deserializeGraph,
  deserializeProject,
  serializeGraph,
  serializeProject,
} from '@ironclad/rivet-core';
import { IOProvider } from './IOProvider.js';
import { TrivetTestSuite } from '@ironclad/trivet';

export class BrowserIOProvider implements IOProvider {
  static isSupported(): boolean {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
  }

  async saveGraphData(graphData: NodeGraph): Promise<void> {
    const fileHandle = await window.showSaveFilePicker();
    const writable = await fileHandle.createWritable();
    await writable.write(serializeGraph(graphData) as string);
    await writable.close();
  }

  async saveProjectData(project: Project, testSuites: TrivetTestSuite[]): Promise<string | undefined> {
    const fileHandle = await window.showSaveFilePicker();
    const writable = await fileHandle.createWritable();
    await writable.write(serializeProject(project) as string);
    await writable.close();
    return fileHandle.name;
  }

  async saveProjectDataNoPrompt(project: Project, testSuites: TrivetTestSuite[], path: string): Promise<void> {
    throw new Error('Function not supported in the browser');
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback(deserializeGraph(text));
  }

  async loadProjectData(callback: (data: { project: Project; testData: TrivetTestSuite[]; path: string }) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback({ project: deserializeProject(text), testData: [], path: fileHandle.name });
  }

  async loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
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
