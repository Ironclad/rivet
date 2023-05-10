import { Project } from '@ironclad/nodai-core';

import { readFile } from 'node:fs/promises';

export async function loadProjectFromFile(path: string): Promise<Project> {
  const content = await readFile(path, { encoding: 'utf8' });
  return loadProjectFromString(content);
}

export function loadProjectFromString(content: string): Project {
  const json = JSON.parse(content);
  if ('metadata' in json && 'graphs' in json) {
    return json as Project;
  }

  throw new Error('Invalid project file');
}
