import { type NodeGraph, type Project, type ExecutionRecorder } from '@ironclad/rivet-core';
import { type TrivetData } from '@ironclad/trivet';

export interface IOProvider {
  saveGraphData(graphData: NodeGraph): Promise<void>;

  saveProjectData(project: Project, testData: TrivetData): Promise<string | undefined>;

  saveProjectDataNoPrompt(project: Project, testData: TrivetData, path: string): Promise<void>;

  loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void>;

  loadProjectData(callback: (data: { project: Project; testData: TrivetData; path: string }) => void): Promise<void>;

  loadProjectDataNoPrompt(path: string): Promise<{ project: Project; testData: TrivetData }>;

  loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void>;

  openDirectory(): Promise<string | string[] | null>;

  openFilePath(): Promise<string>;

  saveString(content: string, defaultFileName: string): Promise<void>;

  readFileAsString(callback: (data: string) => void): Promise<void>;

  readFileAsBinary(callback: (data: Uint8Array) => void): Promise<void>;

  readPathAsString(path: string): Promise<string>;

  readPathAsBinary(path: string): Promise<Uint8Array>;
}
