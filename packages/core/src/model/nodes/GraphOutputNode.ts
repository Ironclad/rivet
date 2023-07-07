import { ChartNode, NodeId, NodeOutputDefinition, PortId, NodeInputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { DataType, DataValue } from '../DataValue.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { ControlFlowExcludedPort } from '../../utils/symbols.js';

export type GraphOutputNode = ChartNode<'graphOutput', GraphOutputNodeData>;

export type GraphOutputNodeData = {
  id: string;
  dataType: DataType;
};

export class GraphOutputNodeImpl extends NodeImpl<GraphOutputNode> {
  static create(id: string = 'output', dataType: DataType = 'string'): GraphOutputNode {
    const chartNode: GraphOutputNode = {
      type: 'graphOutput',
      title: 'Graph Output',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        id,
        dataType,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'value' as PortId,
        title: this.data.id,
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'valueOutput' as PortId,
        title: this.data.id,
        dataType: this.chartNode.data.dataType as DataType,
      },
    ];
  }

  getEditors(): EditorDefinition<GraphOutputNode>[] {
    return [
      {
        type: 'string',
        label: 'ID',
        dataKey: 'id',
      },
      {
        type: 'dataTypeSelector',
        label: 'Data Type',
        dataKey: 'dataType',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const value = inputs['value' as PortId] ?? { type: 'any', value: undefined };

    const isExcluded = value.type === 'control-flow-excluded' || inputs[ControlFlowExcludedPort] != null;

    if (isExcluded && context.graphOutputs[this.data.id] == null) {
      context.graphOutputs[this.data.id] = {
        type: 'control-flow-excluded',
        value: undefined,
      };
    } else if (
      context.graphOutputs[this.data.id] == null ||
      context.graphOutputs[this.data.id]?.type === 'control-flow-excluded'
    ) {
      context.graphOutputs[this.data.id] = value;
    }

    if (isExcluded) {
      return {
        ['valueOutput' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return inputs;
  }
}

export const graphOutputNode = nodeDefinition(GraphOutputNodeImpl, 'Graph Output');
