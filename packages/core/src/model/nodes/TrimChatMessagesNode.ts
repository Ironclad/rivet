import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../../model/NodeBase.js';
import { NodeImpl, type NodeUIData } from '../../model/NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';
import {
  coerceType,
  type EditorDefinition,
  type Inputs,
  type InternalProcessContext,
  type NodeBodySpec,
  type Outputs,
} from '../../index.js';
import { type ChatCompletionRequestMessage, openAiModelOptions, openaiModels } from '../../utils/openai.js';
import { dedent } from 'ts-dedent';
import { expectType } from '../../utils/expectType.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { TokenizerCallInfo } from '../../integrations/Tokenizer.js';

export type TrimChatMessagesNodeData = {
  maxTokenCount: number;
  removeFromBeginning: boolean;
};

export type TrimChatMessagesNode = ChartNode<'trimChatMessages', TrimChatMessagesNodeData>;

export class TrimChatMessagesNodeImpl extends NodeImpl<TrimChatMessagesNode> {
  static create() {
    const chartNode: TrimChatMessagesNode = {
      type: 'trimChatMessages',
      title: 'Trim Chat Messages',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        maxTokenCount: 4096,
        removeFromBeginning: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'chat-message[]',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'trimmed' as PortId,
        title: 'Trimmed',
        dataType: 'chat-message[]',
      },
    ];
  }

  getEditors(): EditorDefinition<TrimChatMessagesNode>[] {
    return [
      {
        type: 'number',
        label: 'Max Token Count',
        dataKey: 'maxTokenCount',
      },
      {
        type: 'toggle',
        label: 'Remove From Beginning',
        dataKey: 'removeFromBeginning',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      Max Token Count: ${this.data.maxTokenCount}
      Remove From Beginning: ${this.data.removeFromBeginning ? 'Yes' : 'No'}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes an array of chat messages, and slices messages from the beginning or the end of the list until the total length of the messages is under the configured token length.

        Useful for setting up infinite message chains that stay under the LLM context limit.
      `,
      infoBoxTitle: 'Trim Chat Messages Node',
      contextMenuTitle: 'Trim Chat Messages',
      group: ['AI'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext<TrimChatMessagesNode>): Promise<Outputs> {
    const input = coerceType(inputs['input' as PortId], 'chat-message[]');
    const maxTokenCount = this.chartNode.data.maxTokenCount;
    const removeFromBeginning = this.chartNode.data.removeFromBeginning;

    const trimmedMessages = [...input];

    const tokenizerInfo: TokenizerCallInfo = {
      node: this.chartNode,
    };

    let tokenCount = context.tokenizer.getTokenCountForMessages(trimmedMessages, tokenizerInfo);

    while (tokenCount > maxTokenCount) {
      if (removeFromBeginning) {
        trimmedMessages.shift();
      } else {
        trimmedMessages.pop();
      }
      tokenCount = context.tokenizer.getTokenCountForMessages(trimmedMessages, tokenizerInfo);
    }

    return {
      ['trimmed' as PortId]: {
        type: 'chat-message[]',
        value: trimmedMessages,
      },
    };
  }
}

export const trimChatMessagesNode = nodeDefinition(TrimChatMessagesNodeImpl, 'Trim Chat Messages');
