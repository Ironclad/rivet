import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { EditorDefinition, coerceTypeOptional } from '../../index.js';
import { dedent } from 'ts-dedent';

export type NumberNode = ChartNode<'number', NumberNodeData>;

export type NumberNodeData = {
  value?: number;
  useValueInput?: boolean;
  round?: boolean;
  roundTo?: number;
};

export class NumberNodeImpl extends NodeImpl<NumberNode> {
  static create(): NumberNode {
    const chartNode: NumberNode = {
      type: 'number',
      title: 'Number',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 150,
      },
      data: {
        value: 0,
        round: false,
        roundTo: 0,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return this.data.useValueInput
      ? [
          {
            dataType: 'any',
            id: 'input' as PortId,
            title: 'Input',
          },
        ]
      : [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'number',
        id: 'value' as PortId,
        title: 'Value',
      },
    ];
  }

  getEditors(): EditorDefinition<NumberNode>[] {
    return [
      { type: 'number', label: 'Value', dataKey: 'value', useInputToggleDataKey: 'useValueInput' },
      { type: 'toggle', label: 'Round', dataKey: 'round' },
      { type: 'number', label: 'Round To', dataKey: 'roundTo' },
    ];
  }

  getBody(): string | undefined {
    return this.data.useValueInput ? `(Input to number)` : (this.data.value ?? 0).toLocaleString();
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Outputs a number constant, or converts an input value into a number.

        Can be configured to round the number to a certain number of decimal places.
      `,
      infoBoxTitle: 'Number Node',
      contextMenuTitle: 'Number',
      group: ['Numbers'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    let value = this.data.useValueInput
      ? coerceTypeOptional(inputs['input' as PortId], 'number') ?? this.data.value ?? 0
      : this.data.value ?? 0;

    const { roundTo = 0, round = false } = this.data;

    if (round) {
      value = Math.round(value * Math.pow(10, roundTo)) / Math.pow(10, roundTo);
    }

    return {
      ['value' as PortId]: {
        type: 'number',
        value,
      },
    };
  }
}

export const numberNode = nodeDefinition(NumberNodeImpl, 'Number');
