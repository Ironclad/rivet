import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl, ProcessContext } from '../NodeImpl';
import * as openai from 'openai';
import { DataValue, expectType, expectTypeOptional } from '../DataValue';

type PromptItem = {
  role: 'user' | 'system';
  content: string;
};

export type ChatNode = ChartNode<'chat', ChatNodeData>;

export type ChatNodeData = {
  model: string;
  useModelInput: boolean;

  temperature: number;
  useTemperatureInput: boolean;

  top_p: number;
  useTopPInput: boolean;

  useTopP: boolean;
  useUseTopPInput: boolean;

  maxTokens: number;
  useMaxTokensInput: boolean;
};

export class ChatNodeImpl extends NodeImpl<ChatNode> {
  static create(): ChatNode {
    const chartNode: ChatNode = {
      type: 'chat',
      title: 'Chat',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        model: 'gpt-3.5-turbo',
        useModelInput: false,

        temperature: 0.5,
        useTemperatureInput: false,

        top_p: 1,
        useTopPInput: false,

        useTopP: false,
        useUseTopPInput: false,

        maxTokens: 1024,
        useMaxTokensInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const messageCount = this.#getMessagePortCount(connections);

    if (this.chartNode.data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
      });
    }

    if (this.chartNode.data.useTemperatureInput) {
      inputs.push({
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
      });
    }

    if (this.chartNode.data.useTopPInput) {
      inputs.push({
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
      });
    }

    for (let i = 1; i <= messageCount; i++) {
      inputs.push({
        dataType: 'chat-message',
        id: `message${i}` as PortId,
        title: `Message ${i}`,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'response' as PortId,
        title: 'Response',
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

  async process(inputs: Record<string, DataValue>, context: ProcessContext): Promise<Record<string, DataValue>> {
    const config = new openai.Configuration({
      apiKey: context.settings.openAiKey,
      organization: context.settings.openAiOrganization,
    });

    const api = new openai.OpenAIApi(config);

    const model = expectTypeOptional(inputs['model'], 'string') ?? this.chartNode.data.model;
    const temperature = expectTypeOptional(inputs['temperature'], 'number') ?? this.chartNode.data.temperature;
    const topP = expectTypeOptional(inputs['top_p'], 'number') ?? this.chartNode.data.top_p;
    const useTopP = expectTypeOptional(inputs['useTopP'], 'boolean') ?? this.chartNode.data.useTopP;
    const messages: openai.ChatCompletionRequestMessage[] = [];

    for (const key in inputs) {
      if (key.startsWith('message')) {
        const inputMessage = expectTypeOptional(inputs[key], 'chat-message');

        if (inputMessage) {
          messages.push({ role: inputMessage.type, content: inputMessage.message });
        }
      }
    }

    const chatCompletionRequest: openai.CreateChatCompletionRequest = {
      model,
      temperature: useTopP ? undefined : temperature,
      top_p: useTopP ? topP : undefined,
      messages,
      max_tokens: this.chartNode.data.maxTokens,
      n: 1,
    };

    try {
      const { data } = await api.createChatCompletion(chatCompletionRequest);
      const aiResponse = data.choices[0].message?.content ?? '';

      return {
        response: {
          type: 'string',
          value: aiResponse,
        },
      };
    } catch (error) {
      console.error('Error processing ChatNode:', error);
      throw new Error('Error processing ChatNode');
    }
  }
}
