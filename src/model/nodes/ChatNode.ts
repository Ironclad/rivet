import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import * as openai from 'openai';

type PromptItem = {
  role: 'user' | 'system';
  content: string;
};

export type ChatNode = ChartNode<'chat', ChatNodeData>;

export type ChatNodeData = {};

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
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
      },
      {
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
      },
      {
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
      },
      {
        dataType: 'chat-messages',
        id: 'messages' as PortId,
        title: 'Messages',
      },
    ];
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
