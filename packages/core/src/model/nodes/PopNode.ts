import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';

export type PopNode = ChartNode<'pop', {}>;

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
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any',
        id: 'lastItem' as PortId,
        title: 'Last',
      },
      {
        dataType: 'any',
        id: 'restOfArray' as PortId,
        title: 'Rest',
      },
    ];
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputArray = inputs['array' as PortId]?.value;

    if (!Array.isArray(inputArray) || inputArray.length === 0) {
      throw new Error('Input array is empty or not an array');
    }

    const lastItem = inputArray[inputArray.length - 1];
    const rest = inputArray.slice(0, inputArray.length - 1);

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
