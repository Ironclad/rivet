import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
  type NodeConnection,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../../index.js';

export type RaceInputsNode = ChartNode<'raceInputs', RaceInputsNodeData>;

export type RaceInputsNodeData = {};

export class RaceInputsNodeImpl extends NodeImpl<RaceInputsNode> {
  static create(): RaceInputsNode {
    const chartNode: RaceInputsNode = {
      type: 'raceInputs',
      title: 'Race Inputs',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {},
    };

    return chartNode;
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const inputConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'),
    );

    let maxInputNumber = 0;
    for (const connection of inputConnections) {
      const messageNumber = parseInt(connection.inputId.replace('input', ''), 10);
      if (messageNumber > maxInputNumber) {
        maxInputNumber = messageNumber;
      }
    }

    return maxInputNumber + 1;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const inputCount = this.#getInputPortCount(connections);

    for (let i = 1; i <= inputCount; i++) {
      inputs.push({
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'result' as PortId,
        title: 'Result',
        dataType: 'any',
      },
    ];
  }

  getEditors(): EditorDefinition<RaceInputsNode>[] {
    return [];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in multiple inputs and outputs the value of the first one to finish. The other inputs are cancelled.
      `,
      infoBoxTitle: 'Race Inputs Node',
      contextMenuTitle: 'Race Inputs',
      group: ['Logic'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    // GraphProcessor handles most of the racing/aborting logic for us.
    const value = Object.entries(inputs).find(
      ([key, value]) => key.startsWith('input') && value !== undefined && value.type !== 'control-flow-excluded',
    );

    if (!value) {
      return {
        ['result' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    return {
      ['result' as PortId]: value[1],
    };
  }
}

export const raceInputsNode = nodeDefinition(RaceInputsNodeImpl, 'Race Inputs');
