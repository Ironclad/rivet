import { ChartNode, NodeId, PortId, NodeInputDefinition, NodeOutputDefinition } from '../../model/NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../../model/NodeImpl';
import { DataValue } from '../../model/DataValue';
import { SupportedModels, getTokenCountForMessages, modelOptions, modelToTiktokenModel } from '../../utils/tokenizer';
import { nanoid } from 'nanoid';
import { expectType } from '../..';
import { ChatCompletionRequestMessage } from '../../utils/openai';

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

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const input = expectType(inputs['input' as PortId], 'chat-message[]');
    const maxTokenCount = this.chartNode.data.maxTokenCount;
    const removeFromBeginning = this.chartNode.data.removeFromBeginning;

    const model = 'gpt-3.5-turbo' as SupportedModels; // You can change this to a configurable model if needed
    const tiktokenModel = modelToTiktokenModel[model];

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
          (message): ChatCompletionRequestMessage => ({ content: message.message, role: message.type }),
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
