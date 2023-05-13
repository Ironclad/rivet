import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { DataValue, ControlFlowExcludedDataValue, ScalarDataValue, ArrayDataValue } from '../DataValue';
import { nanoid } from 'nanoid';

export type IfNode = ChartNode<'if', IfNodeData>;

export type IfNodeData = {};

export class IfNodeImpl extends NodeImpl<ChartNode> {
  static create = (): IfNode => {
    const chartNode: IfNode = {
      type: 'if',
      title: 'If',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 100,
      },
    };
    return chartNode;
  };
  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    return [
      {
        id: 'if' as PortId,
        title: 'If',
        dataType: 'string',
      },
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: 'string',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  async process(inputData: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const ifValue = inputData['if'];
    const value = inputData['value'] ?? { type: 'any', value: undefined };

    const excluded = {
      output: {
        type: 'control-flow-excluded',
        value: undefined,
      } as ControlFlowExcludedDataValue,
    };

    if (!ifValue) {
      return excluded;
    }

    if (ifValue.type === 'control-flow-excluded') {
      return excluded;
    }

    if (ifValue.type === 'string' && !ifValue.value) {
      return excluded;
    }

    if (ifValue.type === 'boolean' && !ifValue.value) {
      return excluded;
    }

    if (ifValue.type.endsWith('[]') && (ifValue as ArrayDataValue<ScalarDataValue>).value.length === 0) {
      return excluded;
    }

    return {
      output: value,
    };
  }
}
