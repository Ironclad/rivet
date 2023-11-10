import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { type ArrayDataValue, type DataValue, type ScalarDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import { coerceType } from '../../utils/coerceType.js';

export type IfElseNode = ChartNode<'ifElse', IfElseNodeData>;

export type IfElseNodeData = {
  /** If true, unconnected input ports are control-flow-excluded. */
  unconnectedControlFlowExcluded?: boolean;
};

export class IfElseNodeImpl extends NodeImpl<IfElseNode> {
  static create = (): IfElseNode => {
    const chartNode: IfElseNode = {
      type: 'ifElse',
      title: 'If/Else',
      id: nanoid() as NodeId,
      data: {
        // Legacy behavior is false
        unconnectedControlFlowExcluded: true,
      },
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
        description:
          'If this is truthy, the `true` value will be passed through the output port. Otherwise, the `false` value will be passed through the output port. An unconnected port is considered false. A `Not Ran` value is considered false.',
      },
      {
        id: 'true' as PortId,
        title: 'True',
        dataType: 'any',
        description: 'The value to pass through the output port if the condition is truthy. ',
      },
      {
        id: 'false' as PortId,
        title: 'False',
        dataType: 'any',
        description: 'The value to pass through the output port if the condition is not truthy.',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'any',
        description: 'The `true` or `false` value, depending on the `if` condition.',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in three inputs: a condition, a true value, and a false value. If the condition is truthy, the true value is passed through the output port. If the condition is not truthy, the false value is passed through the output port.

        This node can "consume" a \`Not Ran\` to continue a graph from that point.
      `,
      infoBoxTitle: 'If/Else Node',
      contextMenuTitle: 'If/Else',
      group: ['Logic'],
    };
  }

  getEditors(): EditorDefinition<IfElseNode>[] {
    return [
      {
        type: 'toggle',
        label: "Don't run unconnected ports",
        dataKey: 'unconnectedControlFlowExcluded',
      },
    ];
  }

  async process(inputData: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const unconnectedValue: DataValue = this.data.unconnectedControlFlowExcluded
      ? { type: 'control-flow-excluded', value: undefined }
      : {
          type: 'any',
          value: undefined,
        };

    const ifValue = inputData['if' as PortId];
    const trueValue = inputData['true' as PortId] ?? unconnectedValue;
    const falseValue = inputData['false' as PortId] ?? unconnectedValue;

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

    if (ifValue?.value == null) {
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
      const asString = coerceType(ifValue, 'string');

      return {
        ['output' as PortId]: asString ? trueValue : falseValue,
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
