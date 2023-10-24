import { loadProjectFromFile, type ProcessContext, type Project } from '../src/index.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));

export async function loadTestGraphs(): Promise<Project> {
  return loadProjectFromFile(join(testDir, './test-graphs.rivet-project'));
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
