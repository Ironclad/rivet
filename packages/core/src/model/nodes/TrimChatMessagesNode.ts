import { ChartNode, NodeId, PortId, NodeInputDefinition, NodeOutputDefinition } from '../../model/NodeBase.js';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../../model/NodeImpl.js';
import { DataValue } from '../../model/DataValue.js';
import { SupportedModels, getTokenCountForMessages, modelOptions, openaiModels } from '../../utils/tokenizer.js';
import { nanoid } from 'nanoid';
import { Inputs, Outputs, expectType } from '../../index.js';
import { ChatCompletionRequestMessage } from '../../utils/openai.js';

export type TrimChatMessagesNodeData = {
  maxTokenCount: number;
  removeFromBeginning: boolean;
  model: SupportedModels;
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
        model: 'gpt-3.5-turbo',
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
      {
        type: 'dropdown',
        label: 'Model',
        dataKey: 'model',
        options: modelOptions,
      },
    ];
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const input = expectType(inputs['input' as PortId], 'chat-message[]');
    const maxTokenCount = this.chartNode.data.maxTokenCount;
    const removeFromBeginning = this.chartNode.data.removeFromBeginning;

    const model = 'gpt-3.5-turbo' as SupportedModels; // You can change this to a configurable model if needed
    const tiktokenModel = openaiModels[model].tiktokenModel;

    let trimmedMessages = [...input];

    let tokenCount = getTokenCountForMessages(
      trimmedMessages.map(
        (message): ChatCompletionRequestMessage => ({ content: message.message, role: message.type }),
      ),
      tiktokenModel,
    );

    while (tokenCount > maxTokenCount) {
      if (removeFromBeginning) {
        trimmedMessages.shift();
      } else {
        trimmedMessages.pop();
      }
      tokenCount = getTokenCountForMessages(
        trimmedMessages.map(
          (message): ChatCompletionRequestMessage => ({
            content: message.message,
            role: message.type,
            function_call: message.function_call,
          }),
        ),
        tiktokenModel,
      );
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
