import {
  type ChartNode,
  type NodeConnection,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { type ChatMessage, arrayizeDataValue, unwrapDataValue } from '../DataValue.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { orderBy } from 'lodash-es';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import type { InternalProcessContext } from '../ProcessContext.js';

export type AssemblePromptNode = ChartNode<'assemblePrompt', AssemblePromptNodeData>;

export type AssemblePromptNodeData = {
  computeTokenCount?: boolean;
};

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
        description: 'A message, or messages, to include in the full prompt.',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [
      {
        dataType: 'chat-message[]',
        id: 'prompt' as PortId,
        title: 'Prompt',
        description: 'The assembled prompt, a list of chat messages.',
      },
    ];

    if (this.data.computeTokenCount) {
      outputs.push({
        dataType: 'number',
        id: 'tokenCount' as PortId,
        title: 'Token Count',
        description: 'The number of tokens in the full output prompt.',
      });
    }

    return outputs;
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

  getEditors(_context: RivetUIContext): EditorDefinition<AssemblePromptNode>[] {
    return [
      {
        type: 'toggle',
        label: 'Compute Token Count',
        dataKey: 'computeTokenCount',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
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

    if (this.data.computeTokenCount) {
      const tokenCount = await context.tokenizer.getTokenCountForMessages(outMessages, undefined, {
        node: this.chartNode,
      });
      output['tokenCount' as PortId] = {
        type: 'number',
        value: tokenCount,
      };
    }

    return output;
  }
}

export const assemblePromptNode = nodeDefinition(AssemblePromptNodeImpl, 'Assemble Prompt');
