import {
  type NodeGraph,
  type Project,
  ExecutionRecorder,
  deserializeGraph,
  deserializeProject,
  serializeGraph,
  serializeProject,
} from '@ironclad/rivet-core';
import { type IOProvider } from './IOProvider.js';
import {
  type SerializedTrivetData,
  type TrivetData,
  deserializeTrivetData,
  serializeTrivetData,
} from '@ironclad/trivet';

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

  async saveProjectData(project: Project, testData: TrivetData): Promise<string | undefined> {
    const fileHandle = await window.showSaveFilePicker();
    const writable = await fileHandle.createWritable();
    await writable.write(serializeProject(project, { trivet: serializeTrivetData(testData) }) as string);
    await writable.close();
    return fileHandle.name;
  }

  async saveProjectDataNoPrompt(project: Project, testData: TrivetData, path: string): Promise<void> {
    throw new Error('Function not supported in the browser');
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback(deserializeGraph(text));
  }

  async loadProjectData(
    callback: (data: { project: Project; testData: TrivetData; path: string }) => void,
  ): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();

    const [project, attachedData] = deserializeProject(text);

    const testData = attachedData?.trivet
      ? deserializeTrivetData(attachedData.trivet as SerializedTrivetData)
      : { testSuites: [] };

    callback({ project, testData, path: fileHandle.name });
  }

  async loadProjectDataNoPrompt(path: string): Promise<{ project: Project; testData: TrivetData }> {
    throw new Error('Function not supported in the browser');
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

  async openFilePath(): Promise<string> {
    const [fileHandle] = await window.showOpenFilePicker();
    return fileHandle.name;
  }

  async saveString(content: string, defaultFileName: string): Promise<void> {
    const fileHandle = await window.showSaveFilePicker({ suggestedName: defaultFileName });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async readFileAsString(callback: (data: string) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const text = await file.text();
    callback(text);
  }

  async readFileAsBinary(callback: (data: Uint8Array) => void): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    callback(new Uint8Array(arrayBuffer));
  }

  async readPathAsString(path: string): Promise<string> {
    throw new Error('Function not supported in the browser');
  }

  async readPathAsBinary(path: string): Promise<Uint8Array> {
    throw new Error('Function not supported in the browser');
  }
}
