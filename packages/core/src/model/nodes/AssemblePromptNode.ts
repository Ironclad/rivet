import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { ChatMessage, arrayizeDataValue, unwrapDataValue } from '../DataValue.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { orderBy } from 'lodash-es';
import { coerceType } from '../../index.js';
import { dedent } from 'ts-dedent';

export type AssemblePromptNode = ChartNode<'assemblePrompt', AssemblePromptNodeData>;

export type AssemblePromptNodeData = {};

export class AssemblePromptNodeImpl extends NodeImpl<AssemblePromptNode> {
  static create(): AssemblePromptNode {
    const chartNode: AssemblePromptNode = {
      type: 'assemblePrompt',
      title: 'Assemble Prompt',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const messageCount = this.#getMessagePortCount(connections);

    for (let i = 1; i <= messageCount; i++) {
      inputs.push({
        dataType: ['chat-message', 'chat-message[]'] as const,
        id: `message${i}` as PortId,
        title: `Message ${i}`,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'chat-message[]',
        id: 'prompt' as PortId,
        title: 'Prompt',
      },
    ];
  }

  #getMessagePortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('message'),
    );

    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace('message', ''));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }

    return maxMessageNumber + 1;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Assembles an array of chat messages for use with a Chat node. The inputs can be strings or chat messages.

        The number of inputs is dynamic based on the number of connections.

        Strings are converted to User type chat messages.
      `,
      infoBoxTitle: 'Assemble Prompt Node',
      contextMenuTitle: 'Assemble Prompt',
      group: ['AI'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const output: Outputs = {};

    const outMessages: ChatMessage[] = [];

    const inputMessages = orderBy(
      Object.entries(inputs).filter(([key]) => key.startsWith('message')),
      ([key]) => key,
      'asc',
    );

    for (const [, inputMessage] of inputMessages) {
      if (!inputMessage || inputMessage.type === 'control-flow-excluded' || !inputMessage.value) {
        continue;
      }

      const inMessages = arrayizeDataValue(unwrapDataValue(inputMessage));
      for (const message of inMessages) {
        if (message.type === 'chat-message') {
          outMessages.push(message.value);
        } else {
          const coerced = coerceType(message, 'chat-message');

          if (coerced) {
            outMessages.push(coerced);
          }
        }
      }
    }

    output['prompt' as PortId] = {
      type: 'chat-message[]',
      value: outMessages,
    };

    return output;
  }
}

export const assemblePromptNode = nodeDefinition(AssemblePromptNodeImpl, 'Assemble Prompt');
