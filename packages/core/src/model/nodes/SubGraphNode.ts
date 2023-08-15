import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { GraphId } from '../NodeGraph.js';
import { nanoid } from 'nanoid';
import { Project } from '../Project.js';
import { GraphInputNode } from './GraphInputNode.js';
import { GraphOutputNode } from './GraphOutputNode.js';
import { ControlFlowExcludedDataValue, DataValue } from '../DataValue.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { EditorDefinition, getError } from '../../index.js';
import { dedent } from 'ts-dedent';

export type SubGraphNode = ChartNode & {
  type: 'subGraph';
  data: {
    graphId: GraphId;
    useErrorOutput?: boolean;
    useAsGraphPartialOutput?: boolean;
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
        useErrorOutput: false,
        useAsGraphPartialOutput: false,
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

  getGraphOutputs(project: Project): NodeOutputDefinition[] {
    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      return [];
    }

    const outputNodes = graph.nodes.filter((node) => node.type === 'graphOutput') as GraphOutputNode[];
    const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();

    const outputs = outputIds.map(
      (id): NodeOutputDefinition => ({
        id: id as PortId,
        title: id,
        dataType: outputNodes.find((node) => node.data.id === id)!.data.dataType,
      }),
    );

    return outputs;
  }

  getOutputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push(...this.getGraphOutputs(project));

    if (this.data.useErrorOutput) {
      outputs.push({
        id: 'error' as PortId,
        title: 'Error',
        dataType: 'string',
      });
    }

    return outputs;
  }

  getEditors(): EditorDefinition<SubGraphNode>[] {
    return [
      {
        type: 'graphSelector',
        label: 'Graph',
        dataKey: 'graphId',
      },
      {
        type: 'toggle',
        label: 'Use Error Output',
        dataKey: 'useErrorOutput',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Executes another graph. Inputs and outputs are defined by Graph Input and Graph Output nodes within the subgraph.
      `,
      infoBoxTitle: 'Subgraph Node',
      contextMenuTitle: 'Subgraph',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { project } = context;

    if (!project) {
      throw new Error('SubGraphNode requires a project to be set in the context.');
    }

    const subGraphProcessor = context.createSubProcessor(this.data.graphId, { signal: context.signal });

    try {
      const startTime = Date.now();

      const outputs = await subGraphProcessor.processGraph(
        context,
        inputs as Record<string, DataValue>,
        context.contextValues,
      );

      const duration = Date.now() - startTime;

      if (this.data.useErrorOutput) {
        outputs['error' as PortId] = {
          type: 'control-flow-excluded',
          value: undefined,
        };
      }

      if (outputs['duration' as PortId] == null) {
        outputs['duration' as PortId] = {
          type: 'number',
          value: duration,
        };
      }

      return outputs;
    } catch (err) {
      if (!this.data.useErrorOutput) {
        throw err;
      }

      const outputs: Outputs = this.getGraphOutputs(context.project).reduce(
        (obj, output): Outputs => ({
          ...obj,
          [output.id as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
        }),
        {} as Outputs,
      );

      outputs['error' as PortId] = {
        type: 'string',
        value: getError(err).message,
      };

      return outputs;
    }
  }
}

export const subGraphNode = nodeDefinition(SubGraphNodeImpl, 'Subgraph');
