import type { Project, NodeGraph } from '../../index.js';
import { doubleCheckProject } from './serializationUtils.js';
// @ts-ignore
import * as yaml from 'yaml';

export function projectV2Deserializer(data: unknown): Project {
  if (typeof data !== 'string') {
    throw new Error('Project v2 deserializer requires a string');
  }

  const project = yaml.parse(data) as { version: number; data: Project };

  if (project.version !== 2) {
    throw new Error('Project v2 deserializer requires a version 2 project');
  }

  doubleCheckProject(project.data);

  return project.data;
}

export function graphV2Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v2 deserializer requires a string');
  }

  const graph = yaml.parse(data) as { version: number; data: NodeGraph };

  if (graph.version !== 2) {
    throw new Error('Graph v2 deserializer requires a version 2 graph');
  }

  return graph.data;
}
