import { mapValues } from 'lodash-es';
import type {
  NodeGraph,
  Project,
  GraphId,
  NodeId,
  NodeConnection,
  ChartNode,
  PortId,
  ChartNodeVariant,
  ProjectId,
} from '../../index.js';
import stableStringify from 'safe-stable-stringify';
// @ts-ignore
import * as yaml from 'yaml';
import { doubleCheckProject } from './serializationUtils.js';

type SerializedProject = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
  };

  graphs: Record<GraphId, SerializedGraph>;
};

type SerializedGraph = {
  metadata: {
    id: GraphId;
    name: string;
    description: string;
  };

  nodes: Record<NodeId, SerializedNode>;
};

export type SerializedNode = {
  type: string;
  id: string;
  title: string;
  description?: string;
  isSplitRun?: boolean;
  splitRunMax?: number;

  // x/y/width/zIndex
  visualData: `${string}/${string}/${string}/${string}`;
  outgoingConnections: SerializedNodeConnection[];
  data?: unknown;
  variants?: ChartNodeVariant<unknown>[];
};

/** x/y/width/zIndex */
type SerializedVisualData = `${string}/${string}/${string}/${string}`;

// portId->nodeId/portId
type SerializedNodeConnection = `${string}->"${string}" ${string}/${string}`;

export function projectV3Deserializer(data: unknown): Project {
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

export function graphV3Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v3 deserializer requires a string');
  }

  const serializedGraph = yaml.parse(data) as { version: number; data: SerializedGraph };

  if (serializedGraph.version !== 3) {
    throw new Error('Graph v3 deserializer requires a version 3 graph');
  }

  return fromSerializedGraph(serializedGraph.data);
}

export function projectV3Serializer(project: Project): unknown {
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

export function graphV3Serializer(graph: NodeGraph): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(toSerializedGraph(graph)));

  const serialized = yaml.stringify(
    {
      version: 4,
      data: stabilized,
    },
    null,
    {
      indent: 2,
    },
  );

  return serialized;
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
    plugins: [],
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
