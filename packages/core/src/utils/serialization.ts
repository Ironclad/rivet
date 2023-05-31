// @ts-ignore
import * as yaml from 'yaml';
import { NodeGraph, Project } from '..';
import stableStringify from 'safe-stable-stringify';

export function serializeProject(project: Project): unknown {
  return projectV2Serializer(project);
}

export function deserializeProject(serializedProject: unknown): Project {
  try {
    return projectV2Deserializer(serializedProject);
  } catch (err) {
    try {
      return projectV1Deserializer(serializedProject);
    } catch (err) {
      throw new Error('Could not deserialize project');
    }
  }
}

export function serializeGraph(graph: NodeGraph): unknown {
  return graphV2Serializer(graph);
}

export function deserializeGraph(serializedGraph: unknown): NodeGraph {
  try {
    return graphV2Deserializer(serializedGraph);
  } catch (err) {
    try {
      return graphV1Deserializer(serializedGraph);
    } catch (err) {
      throw new Error('Could not deserialize graph');
    }
  }
}

function projectV2Serializer(project: Project): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(project));

  const serialized = yaml.stringify(
    {
      version: 2,
      data: stabilized,
    },
    null,
    {
      indent: 2,
    },
  );

  return serialized;
}

function projectV2Deserializer(data: unknown): Project {
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

function projectV1Deserializer(data: unknown): Project {
  if (typeof data !== 'string') {
    throw new Error('Project v1 deserializer requires a string');
  }

  const project = JSON.parse(data);

  doubleCheckProject(project);

  return project;
}

function graphV2Serializer(graph: NodeGraph): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(graph));

  const serialized = yaml.stringify(
    {
      version: 2,
      data: stabilized,
    },
    null,
    {
      indent: 2,
    },
  );

  return serialized;
}

function graphV2Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v2 deserializer requires a string');
  }

  const graph = yaml.parse(data) as { version: number; data: NodeGraph };

  if (graph.version !== 2) {
    throw new Error('Graph v2 deserializer requires a version 2 graph');
  }

  return graph.data;
}

function graphV1Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v1 deserializer requires a string');
  }

  const graph = JSON.parse(data);

  if (!graph.nodes || !graph.connections) {
    throw new Error('Invalid graph file');
  }

  return graph;
}

function doubleCheckProject(project: Project): void {
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
