import type { Project, NodeGraph } from '../../index.js';
import { doubleCheckProject } from './serializationUtils.js';

export function projectV1Deserializer(data: unknown): Project {
  if (typeof data !== 'string') {
    throw new Error('Project v1 deserializer requires a string');
  }

  const project = JSON.parse(data);

  doubleCheckProject(project);

  return project;
}

export function graphV1Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v1 deserializer requires a string');
  }

  const graph = JSON.parse(data);

  if (!graph.nodes || !graph.connections) {
    throw new Error('Invalid graph file');
  }

  return graph;
}
