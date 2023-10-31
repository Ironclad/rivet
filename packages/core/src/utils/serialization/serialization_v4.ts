import { mapValues } from 'lodash-es';
import type {
  NodeGraph,
  Project,
  GraphId,
  NodeId,
  NodeConnection,
  ChartNode,
  PortId,
  ProjectId,
  ChartNodeVariant,
} from '../../index.js';
import stableStringify from 'safe-stable-stringify';
import * as yaml from 'yaml';
import { type AttachedData, doubleCheckProject } from './serializationUtils.js';
import { entries } from '../typeSafety.js';
import type { PluginLoadSpec } from '../../model/PluginLoadSpec.js';
import type { CombinedDataset } from './serialization.js';

type SerializedProject = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
  };

  graphs: Record<GraphId, SerializedGraph>;

  attachedData?: AttachedData;
  plugins?: PluginLoadSpec[];
};

type SerializedGraphMetadata = {
  id: GraphId;
  name: string;
  description: string;
  attachedData?: AttachedData;
};

type SerializedGraph = {
  metadata: SerializedGraphMetadata;
  nodes: Record<SerializedGraphNodeKey, SerializedNode>;
};

type SerializedNode = {
  description?: string;
  isSplitRun?: boolean;
  splitRunMax?: number;
  isSplitSequential?: boolean;
  visualData: SerializedVisualData;
  outgoingConnections: SerializedNodeConnection[] | undefined;
  data?: unknown;
  variants?: ChartNodeVariant<unknown>[];
  disabled?: boolean;
};

/** x/y/width/zIndex */
type SerializedVisualData = `${string}/${string}/${string}/${string}`;

// portId->nodeId/portId
type SerializedNodeConnection = `${string}->"${string}" ${string}/${string}`;

export function projectV4Deserializer(data: unknown): [Project, AttachedData] {
  if (typeof data !== 'string') {
    throw new Error('Project v4 deserializer requires a string');
  }

  const serializedProject = yaml.parse(data) as { version: number; data: SerializedProject };

  if (serializedProject.version !== 4) {
    throw new Error('Project v4 deserializer requires a version 4 project');
  }

  const [project, attachedData] = fromSerializedProject(serializedProject.data);

  doubleCheckProject(project);

  return [project, attachedData];
}

export function graphV4Deserializer(data: unknown): NodeGraph {
  if (typeof data !== 'string') {
    throw new Error('Graph v4 deserializer requires a string');
  }

  const serializedGraph = yaml.parse(data) as { version: number; data: SerializedGraph };

  if (serializedGraph.version !== 4) {
    throw new Error('Graph v4 deserializer requires a version 4 graph');
  }

  return fromSerializedGraph(serializedGraph.data);
}

export function projectV4Serializer(project: Project, attachedData?: AttachedData): unknown {
  // Make sure all data is ordered deterministically first
  const stabilized = JSON.parse(stableStringify(toSerializedProject(project, attachedData)));

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

export function graphV4Serializer(graph: NodeGraph): unknown {
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

function toSerializedProject(project: Project, attachedData?: AttachedData): SerializedProject {
  return {
    metadata: project.metadata,
    graphs: mapValues(project.graphs, (graph) => toSerializedGraph(graph)),
    attachedData,
    plugins: project.plugins ?? [],
  };
}

function fromSerializedProject(serializedProject: SerializedProject): [Project, AttachedData] {
  return [
    {
      metadata: serializedProject.metadata,
      graphs: mapValues(serializedProject.graphs, (graph) => fromSerializedGraph(graph)) as Record<GraphId, NodeGraph>,
      plugins: serializedProject.plugins ?? [],
    },
    serializedProject.attachedData ?? {},
  ];
}

function toSerializedGraph(graph: NodeGraph): SerializedGraph {
  const graphMetadata: SerializedGraphMetadata = {
    id: graph.metadata!.id!,
    name: graph.metadata!.name!,
    description: graph.metadata!.description!,
  };

  if (graph.metadata!.attachedData) {
    graphMetadata.attachedData = graph.metadata!.attachedData;
  }

  return {
    metadata: graphMetadata,
    nodes: graph.nodes.reduce(
      (acc, node) => ({
        ...acc,
        [getGraphNodeKey(node)]: toSerializedNode(node, graph.nodes, graph.connections),
      }),
      {} as Record<NodeId, SerializedNode>,
    ),
  };
}

/** [nodeId]:type "Title of Node" */
type SerializedGraphNodeKey = `[${NodeId}]:${string} "${string}"`;

function getGraphNodeKey(node: ChartNode): string {
  return `[${node.id}]:${node.type} "${node.title}"`;
}

function deserializeGraphNodeKey(key: string): [NodeId, string, string] {
  const { nodeId, type, title } = key.match(/^\[(?<nodeId>[^\]]+)\]:(?<type>[^\s]+) "(?<title>.*)"$/)?.groups ?? {};
  if (!nodeId || !type || !title) {
    throw new Error(`Invalid graph node key: ${key}`);
  }
  return [nodeId as NodeId, type, title];
}

function fromSerializedGraph(serializedGraph: SerializedGraph): NodeGraph {
  const allConnections: NodeConnection[] = [];
  const allNodes: ChartNode[] = [];

  for (const [serializedNodeInfo, node] of entries(serializedGraph.nodes)) {
    const [chartNode, connections] = fromSerializedNode(node, serializedNodeInfo);
    allNodes.push(chartNode);
    allConnections.push(...connections);
  }

  const metadata: SerializedGraphMetadata = {
    id: serializedGraph.metadata.id,
    name: serializedGraph.metadata.name,
    description: serializedGraph.metadata.description,
  };

  if (serializedGraph.metadata.attachedData) {
    metadata.attachedData = serializedGraph.metadata.attachedData;
  }

  return {
    metadata,
    nodes: allNodes,
    connections: allConnections,
  };
}

function toSerializedNode(node: ChartNode, allNodes: ChartNode[], allConnections: NodeConnection[]): SerializedNode {
  const outgoingConnections = allConnections
    .filter((connection) => connection.outputNodeId === node.id)
    .map((connection) => toSerializedConnection(connection, allNodes))
    .sort();
  return {
    description: node.description?.trim() ? node.description : undefined,
    visualData: `${node.visualData.x}/${node.visualData.y}/${node.visualData.width ?? 'null'}/${
      node.visualData.zIndex ?? 'null'
    }/${node.visualData.color?.border ?? ''}/${node.visualData.color?.bg ?? ''}`,
    isSplitRun: node.isSplitRun ? true : undefined,
    splitRunMax: node.isSplitRun ? node.splitRunMax : undefined,

    data: Object.keys(node.data ?? {}).length > 0 ? node.data : undefined,
    outgoingConnections: outgoingConnections.length > 0 ? outgoingConnections : undefined,
    variants: (node.variants?.length ?? 0) > 0 ? node.variants : undefined,
    disabled: node.disabled ? true : undefined,
  };
}

function fromSerializedNode(
  serializedNode: SerializedNode,
  serializedNodeInfo: SerializedGraphNodeKey,
): [ChartNode, NodeConnection[]] {
  const [nodeId, type, title] = deserializeGraphNodeKey(serializedNodeInfo);

  const [x, y, width, zIndex, borderColor, bgColor] = serializedNode.visualData.split('/');

  const connections =
    serializedNode.outgoingConnections?.map((serializedConnection) =>
      fromSerializedConnection(serializedConnection, nodeId),
    ) ?? [];

  const color = borderColor || bgColor ? { border: borderColor!, bg: bgColor! } : undefined;

  return [
    {
      id: nodeId,
      type,
      title,
      description: serializedNode.description,
      isSplitRun: serializedNode.isSplitRun ?? false,
      splitRunMax: serializedNode.splitRunMax ?? 10,
      isSplitSequential: serializedNode.isSplitSequential ?? false,
      visualData: {
        x: parseFloat(x!),
        y: parseFloat(y!),
        width: width === 'null' ? undefined : parseFloat(width!),
        zIndex: zIndex === 'null' ? undefined : parseFloat(zIndex!),
        color,
      },
      data: serializedNode.data ?? {},
      variants: serializedNode.variants ?? [],
      disabled: serializedNode.disabled,
    },
    connections,
  ];
}

function toSerializedConnection(connection: NodeConnection, allNodes: ChartNode[]): SerializedNodeConnection {
  return `${connection.outputId}->"${allNodes.find((node) => node.id === connection.inputNodeId)?.title}" ${
    connection.inputNodeId
  }/${connection.inputId}`;
}

function fromSerializedConnection(connection: SerializedNodeConnection, nodeId: NodeId): NodeConnection {
  const [, outputId, , inputNodeId, inputId] = connection.match(/(.+)->"(.+)" (.+)\/(.+)/)!;

  return {
    outputId: outputId as PortId,
    outputNodeId: nodeId,
    inputId: inputId as PortId,
    inputNodeId: inputNodeId as NodeId,
  };
}

export function datasetV4Serializer(datasets: CombinedDataset[]): string {
  const dataContainer = {
    datasets,
  };

  const data = JSON.stringify(dataContainer);

  return data;
}

export function datasetV4Deserializer(serializedDatasets: string): CombinedDataset[] {
  const stringData = serializedDatasets as string;

  const dataContainer = JSON.parse(stringData) as { datasets: CombinedDataset[] };

  if (!dataContainer.datasets) {
    throw new Error('Invalid dataset data');
  }

  return dataContainer.datasets;
}
