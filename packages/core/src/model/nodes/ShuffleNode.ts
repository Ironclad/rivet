import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { shuffle } from 'lodash-es';
import { type DataValue, isArrayDataValue } from '../DataValue.js';
import { dedent } from 'ts-dedent';

export type ShuffleNode = ChartNode<'shuffle'>;

export class ShuffleNodeImpl extends NodeImpl<ShuffleNode> {
  static create(): ShuffleNode {
    const chartNode: ShuffleNode = {
      type: 'shuffle',
      title: 'Shuffle',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        dataType: 'any[]',
        id: 'array' as PortId,
        title: 'Array',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any[]',
        id: 'shuffled' as PortId,
        title: 'Shuffled',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Shuffles the input array. Outputs the shuffled array.
      `,
      infoBoxTitle: 'Shuffle Node',
      contextMenuTitle: 'Shuffle',
      group: ['Lists'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const input = inputs['array' as PortId];

    const items = input ? (isArrayDataValue(input) ? input.value : [input.value]) : [];

    const shuffled = shuffle(items);

    return {
      ['shuffled' as PortId]: {
        type: inputs['array' as PortId]?.type ?? 'any[]',
        value: shuffled,
      } as DataValue,
    };
  }
}

export const shuffleNode = nodeDefinition(ShuffleNodeImpl, 'Shuffle');
