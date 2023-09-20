import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { ControlFlowExcludedDataValue, ScalarDataValue, ArrayDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { dedent } from 'ts-dedent';

export type IfNode = ChartNode<'if', IfNodeData>;

export type IfNodeData = {};

export class IfNodeImpl extends NodeImpl<IfNode> {
  static create = (): IfNode => {
    const chartNode: IfNode = {
      type: 'if',
      title: 'If',
      id: nanoid() as NodeId,
      data: {},
      visualData: {
        x: 0,
        y: 0,
        width: 125,
      },
    };
    return chartNode;
  };
  getInputDefinitions(): NodeInputDefinition[] {
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
        title: 'True',
        dataType: 'string',
      },
      {
        id: 'falseOutput' as PortId,
        title: 'False',
        dataType: 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in a condition and a value. If the condition is truthy, the value is passed through the True port, and the False port is not ran.
        If the condition is falsy, the value is passed through the False port, and the True port is not ran.
      `,
      infoBoxTitle: 'If Node',
      contextMenuTitle: 'If',
      group: ['Logic'],
    };
  }

  async process(inputData: Inputs): Promise<Outputs> {
    const ifValue = inputData['if' as PortId];
    const value = inputData['value' as PortId] ?? { type: 'any', value: undefined };

    const isFalse = {
      output: {
        type: 'control-flow-excluded',
        value: undefined,
      } as ControlFlowExcludedDataValue,
      falseOutput: value,
    };

    if (!ifValue) {
      return isFalse;
    }

    if (ifValue.type === 'control-flow-excluded') {
      return isFalse;
    }

    if (ifValue.type === 'string' && !ifValue.value) {
      return isFalse;
    }

    if (ifValue.type === 'boolean' && !ifValue.value) {
      return isFalse;
    }

    if (ifValue.type.endsWith('[]')) {
      const value = ifValue as ArrayDataValue<ScalarDataValue>;

      if (!value.value || value.value.length === 0) {
        return isFalse;
      }
    }

    return {
      ['output' as PortId]: value,
      ['falseOutput' as PortId]: {
        type: 'control-flow-excluded',
        value: undefined,
      } as ControlFlowExcludedDataValue,
    };
  }
}

export const ifNode = nodeDefinition(IfNodeImpl, 'If');
