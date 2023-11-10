import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import {
  type ControlFlowExcludedDataValue,
  type ScalarDataValue,
  type ArrayDataValue,
  type DataValue,
} from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import { coerceType } from '../../utils/coerceType.js';

export type IfNode = ChartNode<'if', IfNodeData>;

export type IfNodeData = {
  unconnectedControlFlowExcluded?: boolean;
};

export class IfNodeImpl extends NodeImpl<IfNode> {
  static create = (): IfNode => {
    const chartNode: IfNode = {
      type: 'if',
      title: 'If',
      id: nanoid() as NodeId,
      data: {
        // Legacy behavior is false
        unconnectedControlFlowExcluded: true,
      },
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
        dataType: 'any',
        description:
          'If this is truthy, the value will be passed through the True port. Otherwise, it will be passed through the False port. An unconnected port is considered false.',
      },
      {
        id: 'value' as PortId,
        title: 'Value',
        dataType: 'any',
        description: 'The value to pass through the True or False port. If unconnected, it will be undefined.',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'True',
        dataType: 'any',
        description: 'The `value` passed through if the condition is truthy.',
      },
      {
        id: 'falseOutput' as PortId,
        title: 'False',
        dataType: 'any',
        description: 'The `value` passed through if the condition is falsy.',
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

  getEditors(): EditorDefinition<IfNode>[] {
    return [
      {
        type: 'toggle',
        label: "Don't run unconnected value",
        dataKey: 'unconnectedControlFlowExcluded',
      },
    ];
  }

  async process(inputData: Inputs): Promise<Outputs> {
    const unconnectedValue: DataValue = this.data.unconnectedControlFlowExcluded
      ? { type: 'control-flow-excluded', value: undefined }
      : { type: 'any', value: undefined };

    const ifValue = inputData['if' as PortId];
    const value = inputData['value' as PortId] ?? unconnectedValue;

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

    if (ifValue.type === 'chat-message') {
      const asString = coerceType(ifValue, 'string');

      if (!asString) {
        return isFalse;
      }
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
