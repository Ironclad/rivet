import { NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { ArrayDataValue, DataValue, ScalarDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid';
import { ControlFlowExcludedPort } from '../../utils/symbols.js';

export type IfElseNode = ChartNode<'ifElse', IfElseNodeData>;

export type IfElseNodeData = {};

export class IfElseNodeImpl extends NodeImpl<IfElseNode> {
  static create = (): IfElseNode => {
    const chartNode: IfElseNode = {
      type: 'ifElse',
      title: 'If/Else',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
    };
    return chartNode;
  };
  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'if' as PortId,
        title: 'If',
        dataType: 'any',
      },
      {
        id: 'true' as PortId,
        title: 'True',
        dataType: 'any',
      },
      {
        id: 'false' as PortId,
        title: 'False',
        dataType: 'any',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'any',
      },
    ];
  }

  async process(inputData: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const ifValue = inputData['if' as PortId];
    const trueValue = inputData['true' as PortId] ?? { type: 'any', value: undefined };
    const falseValue = inputData['false' as PortId] ?? { type: 'any', value: undefined };

    if (!(trueValue || falseValue)) {
      return {
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    if (ifValue?.type === 'control-flow-excluded') {
      return {
        ['output' as PortId]: falseValue,
      };
    }

    if (inputData[ControlFlowExcludedPort]) {
      return {
        ['output' as PortId]: falseValue,
      };
    }

    if (ifValue?.type && ifValue.type === 'boolean') {
      return {
        ['output' as PortId]: ifValue.value ? trueValue : falseValue,
      };
    }

    if (ifValue?.type === 'string') {
      return {
        ['output' as PortId]: ifValue.value.length > 0 ? trueValue : falseValue,
      };
    }

    if (ifValue?.type === 'chat-message') {
      return {
        ['output' as PortId]: ifValue.value.message.length > 0 ? trueValue : falseValue,
      };
    }

    if (ifValue?.type.endsWith('[]')) {
      return {
        ['output' as PortId]: (ifValue as ArrayDataValue<ScalarDataValue>).value.length > 0 ? trueValue : falseValue,
      };
    }

    if (ifValue?.type === 'any' || ifValue?.type === 'object') {
      return {
        ['output' as PortId]: !!ifValue.value ? trueValue : falseValue,
      };
    }

    return {
      ['output' as PortId]: falseValue,
    };
  }
}

export const ifElseNode = nodeDefinition(IfElseNodeImpl, 'If/Else');
