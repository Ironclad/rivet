import { type ProjectReference, type Project, deserializeProject } from '@ironclad/rivet-core';
import type { ProjectReferenceLoader } from '../../../core/src/model/ProjectReferenceLoader.js';

import { dirname, relative, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

export class NodeProjectReferenceLoader implements ProjectReferenceLoader {
  async loadProject(currentProjectPath: string | undefined, reference: ProjectReference): Promise<Project> {
    if (currentProjectPath == null) {
      throw new Error('Cannot load project reference without current project path');
    }

    for (const path of reference.hintPaths ?? []) {
      try {
        const fullPath = resolve(dirname(currentProjectPath), path);

        const projectData = await readFile(fullPath, 'utf-8');

        const [project, attachedData] = deserializeProject(projectData);

        return project;
      } catch (error) {
        // ignore
      }
    }

    throw new Error(
      `Could not load project "${reference.title} (${reference.id})": all hint paths failed. Tried: ${reference.hintPaths}`,
    );
  }
}
