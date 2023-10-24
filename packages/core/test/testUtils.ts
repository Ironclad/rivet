import { readFile } from 'node:fs/promises';
import { deserializeProject, GraphProcessor, type ProcessContext, type Project } from '../src/index.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

export async function loadTestGraphs(): Promise<Project> {
  return loadProjectFromFile(join(testDir, './test-graphs.rivet-project'));
}

export async function loadTestGraphInProcessor(graphName: string) {
  const project = await loadTestGraphs();
  const graph = Object.values(project.graphs).find((g) => g.metadata!.name === graphName);

  if (!graph) {
    throw new Error(`Could not find graph with name ${graphName}`);
  }

  return new GraphProcessor(project, graph.metadata!.id!);
}

export async function loadProjectFromFile(path: string): Promise<Project> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectFromString(content);
}

export function loadProjectFromString(content: string): Project {
  const [project] = deserializeProject(content);
  return project;
}

export function testProcessContext(): ProcessContext {
  return {
    settings: {
      openAiKey: process.env.OPENAI_API_KEY,
      openAiOrganization: process.env.OPENAI_ORG_ID,
      openAiEndpoint: process.env.OPENAI_API_ENDPOINT,
    },
  };
}
