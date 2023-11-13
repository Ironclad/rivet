import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { entries } from '../../utils/typeSafety.js';
import { flattenDeep } from 'lodash-es';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type ArrayNode = ChartNode<'array', ArrayNodeData>;

export type ArrayNodeData = {
  flatten?: boolean;
  flattenDeep?: boolean;
};

export class ArrayNodeImpl extends NodeImpl<ArrayNode> {
  static create(): ArrayNode {
    const chartNode: ArrayNode = {
      type: 'array',
      title: 'Array',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        flatten: true,
        flattenDeep: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
        description:
          'An input to create the array from. If an array, will be flattened if the "Flatten" option is enabled.',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any[]',
        id: 'output' as PortId,
        title: 'Output',
        description: 'The array created from the inputs.',
      },
      {
        dataType: 'number[]',
        id: 'indices' as PortId,
        title: 'Indices',
        description:
          'The indices of the array. I.e. [0, 1, 2, 3, etc]. Useful for zipping with the output array to get the indexes.',
      },
      {
        dataType: 'number',
        id: 'length' as PortId,
        title: 'Length',
        description: 'The length of the output array.',
      },
    ];
  }

  getEditors(): EditorDefinition<ArrayNode>[] {
    return [
      { type: 'toggle', label: 'Flatten', dataKey: 'flatten' },
      {
        type: 'toggle',
        label: 'Deep',
        dataKey: 'flattenDeep',
      },
    ];
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const inputConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'),
    );

    let maxInputNumber = 0;
    for (const connection of inputConnections) {
      const inputNumber = parseInt(connection.inputId.replace('input', ''));
      if (inputNumber > maxInputNumber) {
        maxInputNumber = inputNumber;
      }
    }

    return maxInputNumber + 1;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Creates an array from the input values. By default, flattens any arrays which are inputs into a single array. Can be configured to keep the arrays separate, or deeply flatten arrays.

        Useful for both creating and merging arrays.

        The number of inputs is dynamic based on the number of connections.
      `,
      infoBoxTitle: 'Array Node',
      contextMenuTitle: 'Array',
      group: ['Lists'],
    };
  }

  getBody(): NodeBody {
    return dedent`
      ${this.data.flatten ? (this.data.flattenDeep ? 'Flatten (Deep)' : 'Flatten') : 'No Flatten'}
    `;
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const outputArray: any[] = [];

    for (const [key, input] of entries(inputs)) {
      if (key.startsWith('input')) {
        if (this.data.flatten) {
          if (Array.isArray(input?.value)) {
            for (const value of input?.value ?? []) {
              if (this.data.flattenDeep) {
                outputArray.push(...(Array.isArray(value) ? flattenDeep(value) : [value]));
              } else {
                outputArray.push(value);
              }
            }
          } else {
            outputArray.push(input?.value);
          }
        } else {
          outputArray.push(input?.value);
        }
      }
    }

    return {
      ['output' as PortId]: {
        type: 'any[]',
        value: outputArray,
      },
      ['indices' as PortId]: {
        type: 'number[]',
        value: outputArray.map((_, index) => index),
      },
      ['length' as PortId]: {
        type: 'number',
        value: outputArray.length,
      },
    };
  }
}

export const arrayNode = nodeDefinition(ArrayNodeImpl, 'Array');
