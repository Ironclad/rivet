import { Project } from '../../index.js';
// @ts-ignore
import * as yaml from 'yaml';

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
