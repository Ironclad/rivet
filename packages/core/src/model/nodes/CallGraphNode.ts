import {
  type ChartNode,
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
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';
import { looseDataValuesToDataValues, type LooseDataValue } from '../../index.js';
import { getError } from '../../utils/errors.js';

export type CallGraphNode = ChartNode<'callGraph', CallGraphNodeData>;

export type CallGraphNodeData = {
  useErrorOutput?: boolean;
};

export class CallGraphNodeImpl extends NodeImpl<CallGraphNode> {
  static create(): CallGraphNode {
    const chartNode: CallGraphNode = {
      type: 'callGraph',
      title: 'Call Graph',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        useErrorOutput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'graph' as PortId,
      dataType: 'graph-reference',
      title: 'Graph',
      description: 'The reference to the graph to call.',
      required: true,
    });

    inputs.push({
      id: 'inputs' as PortId,
      dataType: 'object',
      title: 'Inputs',
      description:
        'The inputs to pass to the graph. Should be an object where the keys are the input names and the values are the input values.',
    });

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [
      {
        id: 'outputs' as PortId,
        dataType: 'object',
        title: 'Outputs',
        description: 'The outputs of the graph.',
      },
    ];

    if (this.data.useErrorOutput) {
      outputs.push({
        id: 'error' as PortId,
        dataType: 'string',
        title: 'Error',
        description: 'The error message if the graph call failed.',
      });
    }

    return outputs;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Gets a reference to another graph, that can be used to pass around graphs to call using a Call Graph node.
      `,
      infoBoxTitle: 'Call Graph Node',
      contextMenuTitle: 'Call Graph',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const graphRef = coerceTypeOptional(inputs['graph' as PortId], 'graph-reference');
    const graphInputs = coerceTypeOptional(inputs['inputs' as PortId], 'object');

    if (!graphRef) {
      return {
        ['outputs' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    const graph = context.project.graphs[graphRef.graphId];

    if (!graph) {
      return {
        ['outputs' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    const subGraphProcessor = context.createSubProcessor(graphRef.graphId, { signal: context.signal });

    let outputs: Outputs = {};

    try {
      const startTime = Date.now();

      const inputData = looseDataValuesToDataValues(graphInputs as Record<string, LooseDataValue>);

      const graphOutputs = await subGraphProcessor.processGraph(context, inputData, context.contextValues);

      const duration = Date.now() - startTime;

      outputs['outputs' as PortId] = {
        type: 'object',
        value: graphOutputs,
      };

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

      outputs['outputs' as PortId] = {
        type: 'control-flow-excluded',
        value: undefined,
      };

      outputs['error' as PortId] = {
        type: 'string',
        value: getError(err).message,
      };

      return outputs;
    }
  }
}

export const callGraphNode = nodeDefinition(CallGraphNodeImpl, 'Call Graph');
