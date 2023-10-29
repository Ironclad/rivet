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
  TrivetTestSuite,
  deserializeTrivetData,
  serializeTrivetData,
} from '@ironclad/trivet';

export class LegacyBrowserIOProvider implements IOProvider {
  async saveGraphData(graphData: NodeGraph): Promise<void> {
    const serializedData = serializeGraph(graphData);
    const blob = new Blob([serializedData as string], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'graph.rivet-graph';
    link.click();
  }

  async saveProjectData(project: Project, testData: TrivetData): Promise<string | undefined> {
    const serializedData = serializeProject(project, { trivet: serializeTrivetData(testData) });
    const blob = new Blob([serializedData as string], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.rivet-project';
    link.click();
    return link.download;
  }

  async saveProjectDataNoPrompt(_project: Project, _testData: TrivetData, _path: string): Promise<void> {
    throw new Error('Function not supported in the browser');
  }

  async loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rivet-graph';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const text = await file.text();
      callback(deserializeGraph(text));
    };
    input.click();
  }

  async loadProjectData(
    callback: (data: { project: Project; testData: TrivetData; path: string }) => void,
  ): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rivet-project';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const text = await file.text();

      const [project, attachedData] = deserializeProject(text);

      const testData = attachedData?.trivet
        ? deserializeTrivetData(attachedData.trivet as SerializedTrivetData)
        : { testSuites: [] };

      callback({ project, testData, path: file.name });
    };
    input.click();
  }

  async loadProjectDataNoPrompt(path: string): Promise<{ project: Project; testData: TrivetData }> {
    throw new Error('Function not supported in the browser');
  }

  async loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rivet-recording';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const text = await file.text();
      callback({ recorder: ExecutionRecorder.deserializeFromString(text), path: file.name });
    };
    input.click();
  }

  async openDirectory(): Promise<string | string[] | null> {
    throw new Error('Function not supported in the browser');
  }

  async openFilePath(): Promise<string> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement)!.files![0]!;
        resolve(file.name);
      };
      input.click();
    });
  }

  async saveString(content: string, defaultFileName: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFileName;
    link.click();
  }

  async readFileAsString(callback: (data: string) => void): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const text = await file.text();
      callback(text);
    };
    input.click();
  }

  async readFileAsBinary(callback: (data: Uint8Array) => void): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const reader = new FileReader();
      reader.onload = () => {
        callback(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  }

  async readPathAsString(path: string): Promise<string> {
    throw new Error('Function not supported in the browser');
  }

  async readPathAsBinary(path: string): Promise<Uint8Array> {
    throw new Error('Function not supported in the browser');
  }
}
