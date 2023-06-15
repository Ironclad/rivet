// @ts-ignore
import * as yaml from 'yaml';
import {
  ChartNode,
  GraphId,
  NodeConnection,
  NodeGraph,
  NodeId,
  PortId,
  Project,
  SerializedGraph,
  SerializedNode,
  SerializedNodeConnection,
  SerializedProject,
} from '..';
import stableStringify from 'safe-stable-stringify';
import { mapValues } from 'lodash-es';

export function serializeProject(project: Project): unknown {
  return projectV3Serializer(project);
}

export function deserializeProject(serializedProject: unknown): Project {
  try {
    return projectV3Deserializer(serializedProject);
  } catch (err) {
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
}

export function serializeGraph(graph: NodeGraph): unknown {
  return graphV3Serializer(graph);
}

export function deserializeGraph(serializedGraph: unknown): NodeGraph {
  try {
    return graphV3Deserializer(serializedGraph);
  } catch (err) {
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
}

function projectV3Serializer(project: Project): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(toSerializedProject(project)));

  const serialized = yaml.stringify(
    {
      version: 3,
      data: stabilized,
    },
    null,
    {
      indent: 2,
    },
  );

  return serialized;
}

function projectV3Deserializer(data: unknown): Project {
  if (typeof data !== 'string') {
    throw new Error('Project v3 deserializer requires a string');
  }

  const serializedProject = yaml.parse(data) as { version: number; data: SerializedProject };

  if (serializedProject.version !== 3) {
    throw new Error('Project v3 deserializer requires a version 3 project');
  }

  const project = fromSerializedProject(serializedProject.data);

  doubleCheckProject(project);

  return project;
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

function graphV3Serializer(graph: NodeGraph): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(toSerializedGraph(graph)));

  const serialized = yaml.stringify(
    {
      version: 3,
      data: stabilized,
    },
    null,
    {
      indent: 2,
    },
  );

  return serialized;
}

function graphV3Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v3 deserializer requires a string');
  }

  const serializedGraph = yaml.parse(data) as { version: number; data: SerializedGraph };

  if (serializedGraph.version !== 3) {
    throw new Error('Graph v3 deserializer requires a version 3 graph');
  }

  return fromSerializedGraph(serializedGraph.data);
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

function toSerializedProject(project: Project): SerializedProject {
  return {
    metadata: project.metadata,
    graphs: mapValues(project.graphs, (graph) => toSerializedGraph(graph)),
  };
}

function fromSerializedProject(serializedProject: SerializedProject): Project {
  return {
    metadata: serializedProject.metadata,
    graphs: mapValues(serializedProject.graphs, (graph) => fromSerializedGraph(graph)) as Record<GraphId, NodeGraph>,
  };
}

function toSerializedGraph(graph: NodeGraph): SerializedGraph {
  return {
    metadata: {
      id: graph.metadata!.id!,
      name: graph.metadata!.name!,
      description: graph.metadata!.description!,
    },
    nodes: graph.nodes.reduce(
      (acc, node) => ({
        ...acc,
        [node.id]: toSerializedNode(node, graph.nodes, graph.connections),
      }),
      {} as Record<NodeId, SerializedNode>,
    ),
    testCases: graph.testCases,
  };
}

function fromSerializedGraph(serializedGraph: SerializedGraph): NodeGraph {
  const allConnections: NodeConnection[] = [];
  const allNodes: ChartNode[] = [];

  for (const node of Object.values(serializedGraph.nodes)) {
    const [chartNode, connections] = fromSerializedNode(node);
    allNodes.push(chartNode);
    allConnections.push(...connections);
  }

  return {
    metadata: {
      id: serializedGraph.metadata.id,
      name: serializedGraph.metadata.name,
      description: serializedGraph.metadata.description,
    },
    nodes: allNodes,
    connections: allConnections,
    testCases: serializedGraph.testCases,
  };
}

function toSerializedNode(node: ChartNode, allNodes: ChartNode[], allConnections: NodeConnection[]): SerializedNode {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    type: node.type,
    visualData: `${node.visualData.x}/${node.visualData.y}/${node.visualData.width ?? 'null'}/${
      node.visualData.zIndex ?? 'null'
    }`,
    isSplitRun: node.isSplitRun,
    splitRunMax: node.splitRunMax,
    data: node.data,
    outgoingConnections: allConnections
      .filter((connection) => connection.outputNodeId === node.id)
      .map((connection) => toSerializedConnection(connection, allNodes))
      .sort(),
    variants: (node.variants?.length ?? 0) > 0 ? node.variants : undefined,
  };
}

function fromSerializedNode(serializedNode: SerializedNode): [ChartNode, NodeConnection[]] {
  const [x, y, width, zIndex] = serializedNode.visualData.split('/');

  const connections = serializedNode.outgoingConnections.map((serializedConnection) =>
    fromSerializedConnection(serializedConnection, serializedNode),
  );

  return [
    {
      id: serializedNode.id as NodeId,
      title: serializedNode.title,
      description: serializedNode.description,
      type: serializedNode.type,
      isSplitRun: serializedNode.isSplitRun,
      splitRunMax: serializedNode.splitRunMax,
      visualData: {
        x: parseFloat(x!),
        y: parseFloat(y!),
        width: width === 'null' ? undefined : parseFloat(width!),
        zIndex: zIndex === 'null' ? undefined : parseFloat(zIndex!),
      },
      data: serializedNode.data,
      variants: serializedNode.variants,
    },
    connections,
  ];
}

function toSerializedConnection(connection: NodeConnection, allNodes: ChartNode[]): SerializedNodeConnection {
  return `${connection.outputId}->"${allNodes.find((node) => node.id === connection.inputNodeId)?.title}" ${
    connection.inputNodeId
  }/${connection.inputId}`;
}

function fromSerializedConnection(connection: SerializedNodeConnection, outgoingNode: SerializedNode): NodeConnection {
  const [, outputId, , inputNodeId, inputId] = connection.match(/(.+)->"(.+)" (.+)\/(.+)/)!;

  return {
    outputId: outputId as PortId,
    outputNodeId: outgoingNode.id as NodeId,
    inputId: inputId as PortId,
    inputNodeId: inputNodeId as NodeId,
  };
}
