import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type GraphId } from '../NodeGraph.js';
import { nanoid } from 'nanoid/non-secure';
import { type Project, type ProjectId } from '../Project.js';
import { type GraphInputNode } from './GraphInputNode.js';
import { type GraphOutputNode } from './GraphOutputNode.js';
import { type DataValue } from '../DataValue.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { getError } from '../../utils/errors.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import type { EditorDefinition } from '../EditorDefinition.js';

export type ReferencedGraphAliasNode = ChartNode & {
  type: 'referencedGraphAlias';
  data: {
    projectId: ProjectId;
    graphId: GraphId;
    useErrorOutput?: boolean;
    outputCostDuration?: boolean;

    /** Data for each of the inputs of the referenced graph */
    inputData?: Record<string, DataValue>;
  };
};

export class ReferencedGraphAliasNodeImpl extends NodeImpl<ReferencedGraphAliasNode> {
  static create(): ReferencedGraphAliasNode {
    const chartNode: ReferencedGraphAliasNode = {
      type: 'referencedGraphAlias',
      title: '', // Always set initially by the editor
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        projectId: undefined!, // Always set initially by the editor
        graphId: undefined!, // Always set initially by the editor
        useErrorOutput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    _project: Project,
    referencedProjects: Record<ProjectId, Project>,
  ): NodeInputDefinition[] {
    const referencedProject = referencedProjects[this.data.projectId];
    if (!referencedProject) {
      return [];
    }

    const graph = referencedProject.graphs[this.data.graphId];
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

  getGraphOutputs(referencedProject: Project): NodeOutputDefinition[] {
    const graph = referencedProject.graphs[this.data.graphId];
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
    _project: Project,
    referencedProjects: Record<ProjectId, Project>,
  ): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    const referencedProject = referencedProjects[this.data.projectId];
    if (!referencedProject) {
      return outputs;
    }

    outputs.push(...this.getGraphOutputs(referencedProject));

    if (this.data.useErrorOutput) {
      outputs.push({
        id: 'error' as PortId,
        title: 'Error',
        dataType: 'string',
      });
    }

    return outputs;
  }

  getEditors(context: RivetUIContext): EditorDefinition<ReferencedGraphAliasNode>[] {
    const definitions: EditorDefinition<ReferencedGraphAliasNode>[] = [
      {
        type: 'toggle',
        label: 'Use Error Output',
        dataKey: 'useErrorOutput',
      },
      {
        type: 'toggle',
        label: 'Output Cost & Duration',
        dataKey: 'outputCostDuration',
      },
    ];

    const referencedProject = context.referencedProjects[this.data.projectId];
    if (referencedProject) {
      const graph = referencedProject.graphs[this.data.graphId];
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

  getBody(context: RivetUIContext): NodeBody | Promise<NodeBody> {
    return context.referencedProjects[this.data.projectId]?.graphs[this.data.graphId]?.metadata?.description ?? '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        References a graph from another project. Inputs and outputs are defined by Graph Input and Graph Output nodes within the referenced graph.
      `,
      infoBoxTitle: 'Referenced Graph Alias Node',
      contextMenuTitle: 'Referenced Graph Alias',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const referencedProject = context.referencedProjects[this.data.projectId];
    if (!referencedProject) {
      throw new Error(
        `ReferencedGraphAliasNode requires a project with id ${this.data.projectId} to be available in the context.referencedProjects.`,
      );
    }

    const graph = referencedProject.graphs[this.data.graphId];
    if (!graph) {
      throw new Error(
        `ReferencedGraphAliasNode requires a graph with id ${this.data.graphId} to be present in the referenced project.`,
      );
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

    // Create a subprocessor using the referenced project's graph
    const subGraphProcessor = context.createSubProcessor(this.data.graphId, {
      signal: context.signal,
      project: referencedProject!,
    });

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

      if (!this.data.outputCostDuration) {
        delete outputs['cost' as PortId];
        delete outputs['duration' as PortId];
      }

      return outputs;
    } catch (err) {
      if (!this.data.useErrorOutput) {
        throw err;
      }

      const outputs: Outputs = this.getGraphOutputs(referencedProject).reduce(
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

export const referencedGraphAliasNode = nodeDefinition(ReferencedGraphAliasNodeImpl, 'Referenced Graph Alias');
