import type { Project, ProjectReference } from './Project.js';

export type ProjectReferenceLoader = {
  /** Loads a project based on the given reference. */
  loadProject: (currentProjectPath: string | undefined, reference: ProjectReference) => Promise<Project>;
};
