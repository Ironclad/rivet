import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type PopNode = ChartNode<'pop', PopNodeData>;

export type PopNodeData = {
  fromFront?: boolean;
};

export class PopNodeImpl extends NodeImpl<PopNode> {
  static create(): PopNode {
    const baseNode: PopNode = {
      type: 'pop',
      title: 'Pop',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {},
    };

    return baseNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        dataType: 'any[]',
        id: 'array' as PortId,
        title: 'Array',
        coerced: false,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any',
        id: 'lastItem' as PortId,
        title: this.data.fromFront ? 'First' : 'Last',
      },
      {
        dataType: 'any',
        id: 'restOfArray' as PortId,
        title: 'Rest',
      },
    ];
  }

  getEditors(_context: RivetUIContext): EditorDefinition<PopNode>[] | Promise<EditorDefinition<PopNode>[]> {
    return [
      {
        label: 'Pop from front',
        type: 'toggle',
        dataKey: 'fromFront',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Pops the last value off the input array and outputs the new array and the popped value.

        Can also be used to just extract the last value from an array.
      `,
      infoBoxTitle: 'Pop Node',
      contextMenuTitle: 'Pop',
      group: ['Lists'],
    };
  }

  getBody(_context: RivetUIContext): NodeBody | Promise<NodeBody> {
    return this.data.fromFront ? 'From front' : 'From back';
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputArray = inputs['array' as PortId]?.value;

    if (!Array.isArray(inputArray) || inputArray.length === 0) {
      throw new Error('Input array is empty or not an array');
    }

    const lastItem = this.data.fromFront ? inputArray[0] : inputArray[inputArray.length - 1];
    const rest = this.data.fromFront ? inputArray.slice(1) : inputArray.slice(0, inputArray.length - 1);

    return {
      ['lastItem' as PortId]: {
        type: 'any',
        value: lastItem,
      },
      ['restOfArray' as PortId]: {
        type: 'any[]',
        value: rest,
      },
    };
  }
}

export const popNode = nodeDefinition(PopNodeImpl, 'Pop');
