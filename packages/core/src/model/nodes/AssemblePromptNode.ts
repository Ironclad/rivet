import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import {
  ArrayDataValue,
  ChatMessage,
  DataType,
  DataValue,
  ScalarDataValue,
  arrayizeDataValue,
  unwrapDataValue,
} from '../DataValue';
import { Inputs, Outputs } from '../GraphProcessor';
import { orderBy } from 'lodash-es';
import { coerceType } from '../..';

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
        const coerced = coerceType(message, 'string');

        if (coerced) {
          outMessages.push({ type: 'user', message: coerced });
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
