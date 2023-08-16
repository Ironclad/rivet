import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { ControlFlowExcludedDataValue, ScalarDataValue, ArrayDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid';
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
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in a condition and a value. If the condition is truthy, the value is passed through the output port. If the condition is not truthy, the output port is not ran.
      `,
      infoBoxTitle: 'If Node',
      contextMenuTitle: 'If',
      group: ['Logic'],
    };
  }

  async process(inputData: Inputs): Promise<Outputs> {
    const ifValue = inputData['if' as PortId];
    const value = inputData['value' as PortId] ?? { type: 'any', value: undefined };

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

    if (ifValue.type.endsWith('[]')) {
      const value = ifValue as ArrayDataValue<ScalarDataValue>;

      if (!value.value || value.value.length === 0) {
        return excluded;
      }
    }

    return {
      ['output' as PortId]: value,
    };
  }
}

export const ifNode = nodeDefinition(IfNodeImpl, 'If');
