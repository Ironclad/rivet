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

  async saveProjectData(project: Project): Promise<string | undefined> {
    const serializedData = serializeProject(project);
    const blob = new Blob([serializedData as string], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.rivet-project';
    link.click();
    return link.download;
  }

  async saveProjectDataNoPrompt(project: Project, path: string): Promise<void> {
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

  async loadProjectData(callback: (data: { project: Project; path: string }) => void): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rivet-project';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)!.files![0]!;
      const text = await file.text();
      callback({ project: deserializeProject(text), path: file.name });
    };
    input.click();
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

  async openFile(): Promise<string> {
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
}
