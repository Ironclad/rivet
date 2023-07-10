import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceTypeOptional } from '../../index.js';
import { dedent } from 'ts-dedent';

export type RandomNumberNode = ChartNode<'randomNumber', RandomNumberNodeData>;

export type RandomNumberNodeData = {
  min?: number;
  max?: number;
  integers?: boolean;
  maxInclusive?: boolean;
  useMinInput?: boolean;
  useMaxInput?: boolean;
};

export class RandomNumberNodeImpl extends NodeImpl<RandomNumberNode> {
  static create(): RandomNumberNode {
    const chartNode: RandomNumberNode = {
      type: 'randomNumber',
      title: 'RNG',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 150,
      },
      data: {
        min: 0,
        max: 1,
        integers: false,
        maxInclusive: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    if (this.data.useMinInput) {
      inputs.push({
        dataType: 'number',
        id: 'min' as PortId,
        title: 'Min',
      });
    }
    if (this.data.useMaxInput) {
      inputs.push({
        dataType: 'number',
        id: 'max' as PortId,
        title: 'Max',
      });
    }
    return inputs;
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

  getEditors(): EditorDefinition<RandomNumberNode>[] {
    return [
      { type: 'number', label: 'Min', dataKey: 'min', useInputToggleDataKey: 'useMinInput' },
      { type: 'number', label: 'Max', dataKey: 'max', useInputToggleDataKey: 'useMaxInput' },
      { type: 'toggle', label: 'Integers', dataKey: 'integers' },
      { type: 'toggle', label: 'Max Inclusive', dataKey: 'maxInclusive' },
    ];
  }

  getBody(): string | undefined {
    return dedent`
      Min: ${this.data.useMinInput ? '(Input)' : this.data.min ?? 0}
      Max: ${this.data.useMaxInput ? '(Input)' : this.data.max ?? 1}
      ${this.data.integers ? 'Integers' : 'Floats'}
      ${this.data.maxInclusive ? 'Max Inclusive' : 'Max Exclusive'}
    `;
  }

  async process(inputs: Inputs): Promise<Outputs> {
    let min = this.data.useMinInput
      ? coerceTypeOptional(inputs['min' as PortId], 'number') ?? this.data.min ?? 0
      : this.data.min ?? 0;

    let max = this.data.useMaxInput
      ? coerceTypeOptional(inputs['max' as PortId], 'number') ?? this.data.max ?? 1
      : this.data.max ?? 1;

    let value = Math.random() * (max - min) + min;

    if (this.data.integers) {
      value = Math.floor(value);
      if (this.data.maxInclusive && value === max) {
        value = Math.floor(Math.random() * (max - min + 1) + min);
      }
    }

    return {
      ['value' as PortId]: {
        type: 'number',
        value: value,
      },
    };
  }
}

export const randomNumberNode = nodeDefinition(RandomNumberNodeImpl, 'Random Number');
