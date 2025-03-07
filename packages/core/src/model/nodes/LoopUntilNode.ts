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
import { type EditorDefinition } from '../EditorDefinition.js';
import { dedent } from 'ts-dedent';
import type { RivetUIContext } from '../RivetUIContext.js';

type ConditionType = 'allOutputsSet' | 'inputEqual';

export type LoopUntilNode = ChartNode<'loopUntil', LoopUntilNodeData>;

export type LoopUntilNodeData = {
  targetGraph: GraphId | undefined;
  conditionType: ConditionType;
  maxIterations?: number;

  // For inputEqual condition
  inputToCheck?: string;
  targetValue?: string;

  /** Data for each of the inputs of the subgraph */
  inputData?: Record<string, DataValue>;
};

export class LoopUntilNodeImpl extends NodeImpl<LoopUntilNode> {
  static create(): LoopUntilNode {
    const chartNode: LoopUntilNode = {
      type: 'loopUntil',
      title: 'Loop Until',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        targetGraph: undefined,
        conditionType: 'allOutputsSet',
      },
    };

    return chartNode;
  }

  getInputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    // Get inputs from the target graph
    const graph = project.graphs[this.data.targetGraph ?? ('' as GraphId)];
    if (graph) {
      const inputNodes = graph.nodes.filter((node) => node.type === 'graphInput') as GraphInputNode[];
      const inputIds = [...new Set(inputNodes.map((node) => node.data.id))].sort();

      inputIds.forEach((id) => {
        const inputNode = inputNodes.find((node) => node.data.id === id)!;
        inputs.push({
          id: id as PortId,
          title: id,
          dataType: inputNode.data.dataType,
        });
      });
    }

    return inputs;
  }

  getOutputDefinitions(
    _connections: NodeConnection[],
    _nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    // Get outputs from the target graph
    const graph = project.graphs[this.data.targetGraph ?? ('' as GraphId)];
    if (graph) {
      const outputNodes = graph.nodes.filter((node) => node.type === 'graphOutput') as GraphOutputNode[];
      const outputIds = [...new Set(outputNodes.map((node) => node.data.id))].sort();

      outputIds.forEach((id) => {
        const outputNode = outputNodes.find((node) => node.data.id === id)!;
        outputs.push({
          id: id as PortId,
          title: id,
          dataType: outputNode.data.dataType,
        });
      });
    }

    // Add standard loop outputs
    outputs.push(
      {
        id: 'iteration' as PortId,
        title: 'Iterations',
        dataType: 'number',
        description: 'The number of iterations completed.',
      },
      {
        id: 'completed' as PortId,
        title: 'Completed',
        dataType: 'boolean',
        description: 'True when the loop has completed.',
      },
    );

    return outputs;
  }

  getEditors(context: RivetUIContext): EditorDefinition<LoopUntilNode>[] {
    const definitions: EditorDefinition<LoopUntilNode>[] = [
      {
        type: 'graphSelector',
        label: 'Target Graph',
        dataKey: 'targetGraph',
      },
      {
        type: 'dropdown',
        dataKey: 'conditionType',
        label: 'Stop Condition',
        options: [
          { label: 'All Outputs Set', value: 'allOutputsSet' },
          { label: 'Input Equals Value', value: 'inputEqual' },
        ],
        helperMessage: 'The condition that will stop the loop',
      },
      {
        type: 'number',
        dataKey: 'maxIterations',
        label: 'Max Iterations',
        helperMessage: 'Maximum number of iterations (optional, leave empty for unlimited)',
        allowEmpty: true,
      },
    ];

    if (this.data.conditionType === 'inputEqual') {
      definitions.push(
        {
          type: 'string',
          dataKey: 'inputToCheck',
          label: 'Input to Check',
          helperMessage: 'The name of the input to compare',
        },
        {
          type: 'string',
          dataKey: 'targetValue',
          label: 'Target Value',
          helperMessage: 'The value to compare against',
        },
      );
    }

    // Add dynamic editors for graph inputs
    if (this.data.targetGraph) {
      const graph = context.project.graphs[this.data.targetGraph];
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
        Executes a subgraph in a loop until a condition is met. Each iteration's outputs become
        the inputs for the next iteration. Supports different stopping conditions and optional
        maximum iterations.
      `,
      infoBoxTitle: 'Loop Until Node',
      contextMenuTitle: 'Loop Until',
      group: ['Logic'],
    };
  }

  getBody(context: RivetUIContext): string {
    if (!this.data.targetGraph) {
      return 'No target graph selected';
    }

    const graphName = context.project.graphs[this.data.targetGraph]?.metadata?.name ?? 'Unknown Graph';
    const condition =
      this.data.conditionType === 'allOutputsSet'
        ? 'all outputs are set'
        : `${this.data.inputToCheck} equals ${this.data.targetValue}`;

    const maxIterations = this.data.maxIterations ? `\nMax iterations: ${this.data.maxIterations}` : '';

    return `Executes ${graphName}\nuntil ${condition}${maxIterations}`;
  }

  private shouldBreak(outputs: Outputs): boolean {
    if (this.data.conditionType === 'allOutputsSet') {
      // Check if any output is control-flow-excluded
      const anyInputIsExcluded = Object.values(outputs)
        .filter((o) => o != null)
        .some((output) => output.type === 'control-flow-excluded');
      return !anyInputIsExcluded;
    } else if (this.data.conditionType === 'inputEqual' && this.data.inputToCheck && this.data.targetValue) {
      const inputValue = outputs[this.data.inputToCheck as PortId];
      return inputValue?.value?.toString() === this.data.targetValue;
    }

    return false;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    if (!this.data.targetGraph) {
      throw new Error('No target graph selected');
    }

    let iteration = 0;
    let currentInputs = { ...inputs };

    // Add any default values from inputData
    if (this.data.inputData) {
      Object.entries(this.data.inputData).forEach(([key, value]) => {
        if (currentInputs[key as PortId] === undefined) {
          currentInputs[key as PortId] = value;
        }
      });
    }

    let lastOutputs: Outputs = {};

    while (!context.signal.aborted) {
      // Check max iterations if set
      if (this.data.maxIterations && iteration >= this.data.maxIterations) {
        break;
      }

      const subprocessor = context.createSubProcessor(this.data.targetGraph, { signal: context.signal });
      lastOutputs = await subprocessor.processGraph(
        context,
        currentInputs as Record<string, DataValue>,
        context.contextValues,
      );

      iteration++;

      // Check if the condition is met
      if (this.shouldBreak(lastOutputs)) {
        break;
      }

      context.onPartialOutputs?.(lastOutputs);

      // Use outputs as inputs for next iteration
      currentInputs = lastOutputs;
    }

    return {
      ...lastOutputs,
      ['iteration' as PortId]: { type: 'number', value: iteration },
      ['completed' as PortId]: { type: 'boolean', value: true },
    };
  }
}

export const loopUntilNode = nodeDefinition(LoopUntilNodeImpl, 'Loop Until');
