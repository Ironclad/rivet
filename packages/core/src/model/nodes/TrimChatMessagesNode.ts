import { ChartNode, NodeId, PortId, NodeInputDefinition, NodeOutputDefinition } from '../../model/NodeBase';
import { NodeImpl } from '../../model/NodeImpl';
import { DataValue, coerceType, expectType } from '../../model/DataValue';
import { SupportedModels, getTokenCountForMessages, modelToTiktokenModel } from '../../utils/tokenizer';
import { nanoid } from 'nanoid';
import { ChatCompletionRequestMessage } from 'openai';

export type TrimChatMessagesNodeData = {
  maxTokenCount: number;
  removeFromBeginning: boolean;
  model: SupportedModels;
};

export type TrimChatMessagesNode = ChartNode<'trim', TrimChatMessagesNodeData>;

export class TrimChatMessagesNodeImpl extends NodeImpl<TrimChatMessagesNode> {
  static create() {
    const chartNode: TrimChatMessagesNode = {
      type: 'trim',
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

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const input = expectType(inputs['input' as PortId], 'chat-message[]');
    const maxTokenCount = this.chartNode.data.maxTokenCount;
    const removeFromBeginning = this.chartNode.data.removeFromBeginning;

    const model = 'gpt-3.5-turbo' as SupportedModels; // You can change this to a configurable model if needed
    const tiktokenModel = modelToTiktokenModel[model];

    let tokenCount = getTokenCountForMessages(
      input.map((message): ChatCompletionRequestMessage => ({ content: message.message, role: message.type })),
      tiktokenModel,
    );
    let trimmedMessages = [...input];

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
