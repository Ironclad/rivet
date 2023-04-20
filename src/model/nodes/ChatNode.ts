import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import * as openai from 'openai';

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
  #api: openai.OpenAIApi;

  constructor(chartNode: ChatNode) {
    super(chartNode);

    const config = new openai.Configuration({
      accessToken: 'TODO',
    });

    this.#api = new openai.OpenAIApi(config);
  }

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

  async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    const model = inputs['model'];
    const temperature = inputs['temperature'];
    const topP = inputs['top_p'];
    const messages: PromptItem[] = inputs['messages'];

    const chatCompletionRequest: openai.CreateChatCompletionRequest = {
      model,
      temperature,
      top_p: topP,
      messages,
      stream: false,
    };

    await this.#api.createChatCompletion(chatCompletionRequest);

    throw new Error('Not implemented yet');
  }
}
