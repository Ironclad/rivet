import type { Project } from '../../index.js';
import type * as yaml from 'yaml';

/** Additional data that has been attached to a project/graph, for use by plugins, etc. */
export type AttachedData = Record<string, unknown>;

export function doubleCheckProject(project: Project): void {
  if (
    !project.metadata ||
    !project.metadata!.id ||
    !project.metadata!.title ||
    !project.graphs ||
    typeof project.graphs !== 'object'
  ) {
    throw new Error('Invalid project file');
  }
}

export function yamlProblem(err: yaml.YAMLError): never {
  const { code, message, pos, linePos } = err;
  throw new Error(`YAML error: ${code} ${message} at ${pos} ${linePos}`);
}
