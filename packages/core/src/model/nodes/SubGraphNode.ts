import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { NodeImpl } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { GraphId } from '../NodeGraph';
import { nanoid } from 'nanoid';
import { Project } from '../Project';
import { GraphInputNode } from './GraphInputNode';
import { GraphOutputNode } from './GraphOutputNode';
import { DataValue } from '../DataValue';
import { InternalProcessContext } from '../ProcessContext';

export type SubGraphNode = ChartNode & {
  type: 'subGraph';
  data: {
    graphId: GraphId;
  };
};

export class SubGraphNodeImpl extends NodeImpl<SubGraphNode> {
  static create(): SubGraphNode {
    const chartNode: SubGraphNode = {
      type: 'subGraph',
      title: 'Subgraph',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        graphId: '' as GraphId,
      },
    };

    return chartNode;
  }

  getInputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[] {
    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      return [];
    }

    const inputNodes = graph.nodes.filter((node) => node.type === 'graphInput') as GraphInputNode[];
    const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();

    return inputIds.map(
      (id): NodeInputDefinition => ({
        id: id as PortId,
        title: id,
        dataType: inputNodes.find((node) => node.data.id === id)!.data.dataType,
      }),
    );
  }

  getOutputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[] {
    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      return [];
    }

    const outputNodes = graph.nodes.filter((node) => node.type === 'graphOutput') as GraphOutputNode[];
    const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();

    return outputIds.map(
      (id): NodeOutputDefinition => ({
        id: id as PortId,
        title: id,
        dataType: outputNodes.find((node) => node.data.id === id)!.data.dataType,
      }),
    );
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { project } = context;

    if (!project) {
      throw new Error('SubGraphNode requires a project to be set in the context.');
    }

    const subGraphProcessor = context.createSubProcessor(this.data.graphId);
    const subGraphOutputs = await subGraphProcessor.processGraph(
      context,
      inputs as Record<string, DataValue>,
      context.contextValues,
    );

    return subGraphOutputs;
  }
}
