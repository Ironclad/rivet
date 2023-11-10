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
import { type ChatMessage, type ChatMessageMessagePart, arrayizeDataValue, unwrapDataValue } from '../DataValue.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { orderBy } from 'lodash-es';
import { coerceTypeOptional, dedent, getInputOrData } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { match } from 'ts-pattern';

export type AssembleMessageNode = ChartNode<'assembleMessage', AssembleMessageNodeData>;

export type AssembleMessageNodeData = {
  type: 'system' | 'user' | 'assistant' | 'function';
  useTypeInput: boolean;

  toolCallId: string;
  useToolCallIdInput?: boolean;
};

const messageTypeToTitle: Record<ChatMessage['type'], string> = {
  assistant: 'Assistant',
  function: 'Function Tool Call',
  system: 'System',
  user: 'User',
};

export class AssembleMessageNodeImpl extends NodeImpl<AssembleMessageNode> {
  static create(): AssembleMessageNode {
    const chartNode: AssembleMessageNode = {
      type: 'assembleMessage',
      title: 'Assemble Message',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        type: 'user',
        useTypeInput: false,
        toolCallId: '',
        useToolCallIdInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const messageCount = this.#getInputPortCount(connections);

    if (this.data.useTypeInput) {
      inputs.push({
        dataType: 'string',
        id: 'type' as PortId,
        title: 'Type',
        description: 'The type of message to assemble.',
      });
    }

    if (this.data.useToolCallIdInput) {
      inputs.push({
        dataType: 'string',
        id: 'toolCallId' as PortId,
        title: 'Tool Call ID',
        description: 'The ID of the tool call to associate with the message.',
      });
    }

    for (let i = 1; i <= messageCount; i++) {
      inputs.push({
        dataType: ['string', 'image', 'string[]', 'image[]', 'object', 'object[]'] as const,
        id: `part${i}` as PortId,
        title: `Part ${i}`,
        description: 'A part of the message to assemble.',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'chat-message',
        id: 'message' as PortId,
        title: 'Message',
        description: 'The assembled message.',
      },
    ];
  }

  getEditors(): EditorDefinition<AssembleMessageNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Type',
        dataKey: 'type',
        options: [
          { value: 'system', label: 'System' },
          { value: 'user', label: 'User' },
          { value: 'assistant', label: 'Assistant' },
          { value: 'function', label: 'Function' },
        ],
        defaultValue: 'user',
        useInputToggleDataKey: 'useTypeInput',
      },
      {
        type: 'string',
        label: 'Tool Call ID',
        dataKey: 'toolCallId',
        useInputToggleDataKey: 'useToolCallIdInput',
        hideIf: (data) => data.type !== 'function',
      },
    ];
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('part'),
    );

    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace('part', ''));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }

    return maxMessageNumber + 1;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Assembles a single chat message from multiple parts. This is similar to a Prompt node, but works with multimodal
        models, as you can include both text and images in the message.
      `,
      infoBoxTitle: 'Assemble Message Node',
      contextMenuTitle: 'Assemble Message',
      group: 'AI',
    };
  }

  getBody(_context: RivetUIContext): NodeBody | Promise<NodeBody> {
    return dedent`
      ${this.data.useTypeInput ? '(Type From Input)' : messageTypeToTitle[this.data.type]}
      ${
        this.data.useTypeInput || this.data.type === 'function'
          ? `Tool Call ID: ${this.data.useToolCallIdInput ? '(From Input)' : this.data.toolCallId}`
          : ``
      }
    `;
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const output: Outputs = {};

    const type = getInputOrData(this.data, inputs, 'type');

    type MultiMessage = ChatMessage & { message: ChatMessageMessagePart[] };
    const outMessage: MultiMessage = match(type)
      .with(
        'system',
        (type): MultiMessage => ({
          type,
          message: [],
        }),
      )
      .with(
        'user',
        (type): MultiMessage => ({
          type,
          message: [],
        }),
      )
      .with(
        'assistant',
        (type): MultiMessage => ({
          type,
          message: [],
          function_call: undefined, // Not supported yet in Assemble Message node
        }),
      )
      .with(
        'function',
        (type): MultiMessage => ({
          type,
          message: [],
          name: getInputOrData(this.data, inputs, 'toolCallId'),
        }),
      )
      .otherwise(() => {
        throw new Error(`Invalid type: ${type}`);
      });

    const inputParts = orderBy(
      Object.entries(inputs).filter(([key]) => key.startsWith('part')),
      ([key]) => key,
      'asc',
    );

    for (const [, inputPart] of inputParts) {
      if (!inputPart || inputPart.type === 'control-flow-excluded' || !inputPart.value) {
        continue;
      }

      const inPart = arrayizeDataValue(unwrapDataValue(inputPart));
      for (const message of inPart) {
        if (message.type === 'string') {
          outMessage.message.push(message.value);
        } else if (message.type === 'image') {
          outMessage.message.push({
            type: 'image',
            data: message.value.data,
            mediaType: message.value.mediaType,
          });
        } else if (message.type === 'object') {
          if (
            message.value &&
            'type' in message.value &&
            message.value.type === 'url_reference' &&
            typeof message.value.url === 'string'
          ) {
            outMessage.message.push({
              type: 'url',
              url: message.value.url,
            });
          }
        } else {
          const coerced = coerceTypeOptional(message, 'string');

          if (coerced) {
            outMessage.message.push(coerced);
          }
        }
      }
    }

    output['message' as PortId] = {
      type: 'chat-message',
      value: outMessage,
    };

    return output;
  }
}

export const assembleMessageNode = nodeDefinition(AssembleMessageNodeImpl, 'Assemble Prompt');
