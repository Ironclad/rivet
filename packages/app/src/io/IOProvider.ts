import { NodeGraph, Project, ExecutionRecorder } from '@ironclad/rivet-core';
import { TrivetTestSuite } from '@ironclad/trivet';

export interface IOProvider {
  saveGraphData(graphData: NodeGraph): Promise<void>;

  saveProjectData(project: Project, testData: TrivetTestSuite[]): Promise<string | undefined>;

  saveProjectDataNoPrompt(project: Project, testData: TrivetTestSuite[], path: string): Promise<void>;

  loadGraphData(callback: (graphData: NodeGraph) => void): Promise<void>;

  loadProjectData(callback: (data: { project: Project; testData: TrivetTestSuite[]; path: string }) => void): Promise<void>;

  loadRecordingData(callback: (data: { recorder: ExecutionRecorder; path: string }) => void): Promise<void>;

  openDirectory(): Promise<string | string[] | null>;

  openFile(): Promise<string>;
}
