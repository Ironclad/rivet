import { NodeGraph, Project, ExecutionRecorder } from '@ironclad/rivet-core';

export interface IOProvider {
  saveGraphData(graphData: NodeGraph): Promise<void>;

  saveProjectData(project: Project): Promise<string | undefined>;

  saveProjectDataNoPrompt(project: Project, path: string): Promise<void>;

  loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void>;

  loadProjectData(callback: (data: { project: Project; path: string }) => void): Promise<void>;

  loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void>;

  openDirectory(): Promise<string | string[] | null>;

  openFile(): Promise<string>;
}
