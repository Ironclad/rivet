import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type GraphId } from '../NodeGraph.js';
import { nanoid } from 'nanoid/non-secure';
import { type Project } from '../Project.js';
import { type GraphInputNode } from './GraphInputNode.js';
import { type GraphOutputNode } from './GraphOutputNode.js';
import { type DataValue } from '../DataValue.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type DynamicEditorEditor, type EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { getError } from '../../utils/errors.js';
import { match } from 'ts-pattern';
import type { RivetUIContext } from '../RivetUIContext.js';

export type SubGraphNode = ChartNode & {
  type: 'subGraph';
  data: {
    graphId: GraphId;
    useErrorOutput?: boolean;
    useAsGraphPartialOutput?: boolean;

    /** Data for each of the inputs of the subgraph */
    inputData?: Record<string, DataValue>;
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

  getEditors(context: RivetUIContext): EditorDefinition<SubGraphNode>[] {
    const definitions: EditorDefinition<SubGraphNode>[] = [
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

    if (this.data.graphId) {
      const graph = context.project.graphs[this.data.graphId];
      if (graph) {
        const inputNodes = graph.nodes.filter((node) => node.type === 'graphInput') as GraphInputNode[];
        const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();

        for (const inputId of inputIds) {
          const inputNode = inputNodes.find((node) => node.data.id === inputId)!;
          definitions.push({
            type: 'dynamic',
            dataKey: 'inputData',
            dynamicDataKey: inputNode.data.id,
            dataType: inputNode.data.dataType,
            label: inputNode.data.id,
            editor: inputNode.data.editor ?? 'auto',
          });
        }
      }
    }

    return definitions;
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

    const graph = project.graphs[this.data.graphId];
    if (!graph) {
      throw new Error(`SubGraphNode requires a graph with id ${this.data.graphId} to be present in the project.`);
    }

    const inputNodes = graph.nodes.filter((node) => node.type === 'graphInput') as GraphInputNode[];
    const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();

    const inputData = inputIds.reduce((obj, id): Inputs => {
      if (inputs[id as PortId] != null) {
        return {
          ...obj,
          [id]: inputs[id as PortId],
        };
      }

      if (this.data.inputData?.[id] != null) {
        return {
          ...obj,
          [id]: this.data.inputData[id],
        };
      }

      return obj;
    }, {} as Inputs);

    const subGraphProcessor = context.createSubProcessor(this.data.graphId, { signal: context.signal });

    try {
      const startTime = Date.now();

      const outputs = await subGraphProcessor.processGraph(
        context,
        inputData as Record<string, DataValue>,
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
