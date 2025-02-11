import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type ChatMessage, type EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { ChatNodeBase, type ChatNodeData } from './ChatNodeBase.js';
import { coerceType } from '../../utils/coerceType.js';

export type ChatLoopNode = ChartNode<'chatLoop', ChatLoopNodeData>;

export type ChatLoopNodeData = ChatNodeData & {
  userPrompt: string;
  renderingFormat?: 'text' | 'markdown';
};

export class ChatLoopNodeImpl extends NodeImpl<ChatLoopNode> {
  static create(): ChatLoopNode {
    const chartNode: ChatLoopNode = {
      type: 'chatLoop',
      title: 'Chat Loop',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        ...ChatNodeBase.defaultData(),
        userPrompt: 'Your response:',
        renderingFormat: 'markdown',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return ChatNodeBase.getInputDefinitions(this.data);
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string[]',
        id: 'conversation' as PortId,
        title: 'Full Conversation',
      },
      {
        dataType: 'string',
        id: 'lastMessage' as PortId,
        title: 'Last Message',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Creates an interactive chat loop with an AI model. The node will:
        1. Send the initial prompt to the AI
        2. Show the AI's response and prompt for user input
        3. Send the user's input back to the AI
        4. Repeat steps 2-3 until the user ends the conversation

        The conversation history is maintained and sent with each new message.
      `,
      contextMenuTitle: 'Chat Loop',
      infoBoxTitle: 'Chat Loop Node',
      group: ['Convenience'],
    };
  }

  getEditors(): EditorDefinition<ChatLoopNode>[] {
    return [
      ...ChatNodeBase.getEditors(),
      {
        type: 'code',
        label: 'User Prompt',
        dataKey: 'userPrompt',
        language: 'plain-text',
      },
      {
        type: 'group',
        label: 'Rendering',
        editors: [
          {
            type: 'dropdown',
            dataKey: 'renderingFormat',
            label: 'Format',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Markdown', value: 'markdown' },
            ],
            defaultValue: 'markdown',
          },
        ],
      },
    ];
  }

  getBody() {
    return ChatNodeBase.getBody(this.data);
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const conversation: ChatMessage[] = [];
    let continueChat = true;

    conversation.push(...coerceType(inputs['prompt' as PortId], 'chat-message[]'));

    // Initial chat call
    const initialResponse = await ChatNodeBase.process(this.data, this.chartNode, inputs, context);
    const firstMessage = coerceType(initialResponse['response' as PortId], 'string');
    conversation.push({
      type: 'assistant',
      message: firstMessage,
      function_calls: undefined,
      function_call: undefined,
    });

    let messageToUser = firstMessage;

    while (continueChat) {
      // Get user input
      const userResponse = await context.requestUserInput([messageToUser], this.data.renderingFormat ?? 'text');

      // Check if user wants to end conversation
      if (!userResponse || userResponse.value.length === 0 || userResponse.value[0]?.length === 0) {
        continueChat = false;
        break;
      }

      // Add user message to conversation
      conversation.push({
        type: 'user',
        message: userResponse.value[0]!,
      });

      // Prepare next AI message
      const chatInputs = {
        ...inputs,
        prompt: {
          type: 'chat-message[]',
          value: conversation,
        },
      };

      // Get AI response
      const aiResponse = await ChatNodeBase.process(this.data, this.chartNode, chatInputs, context);
      const aiMessage = coerceType(aiResponse['response' as PortId], 'string');
      conversation.push({
        type: 'assistant',
        message: aiMessage,
        function_calls: undefined,
        function_call: undefined,
      });

      messageToUser = aiMessage;
    }

    return {
      ['conversation' as PortId]: {
        type: 'chat-message[]',
        value: conversation,
      },
      ['lastMessage' as PortId]: {
        type: 'chat-message',
        value: conversation.at(-1)!,
      },
    };
  }
}

export const chatLoopNode = nodeDefinition(ChatLoopNodeImpl, 'Chat Loop');
