import { ChartNode, NodeId, NodeInputDefinition, NodeInputId, NodeOutputDefinition, NodeOutputId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import * as openai from 'openai';

type PromptItem = {
  role: 'user' | 'system';
  content: string;
};

export type ChatNode = ChartNode<'chat', ChatNodeData>;

export type ChatNodeData = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  messages: PromptItem[];
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
  static create(
    model: string,
    temperature = 1.0,
    topP = 0.9,
    messages: PromptItem[] = [{ role: 'user', content: '' }],
  ): ChatNodeImpl {
    const inputDefinitions: NodeInputDefinition[] = [
      {
        id: 'model' as NodeInputId,
        title: 'Model',
        dataType: 'string',
        required: false,
        data: model,
      },
      {
        dataType: 'number',
        id: 'temperature' as NodeInputId,
        title: 'Temperature',
        data: temperature,
      },
      {
        dataType: 'number',
        id: 'top_p' as NodeInputId,
        title: 'Top P',
        data: topP,
      },
      {
        dataType: 'chat-messages',
        id: 'messages' as NodeInputId,
        title: 'Messages',
        data: messages,
      },
    ];

    const outputDefinitions: NodeOutputDefinition[] = [
      {
        dataType: 'string',
        id: 'response' as NodeOutputId,
        title: 'Response',
      },
    ];

    const chartNode: ChatNode = {
      type: 'chat',
      title: 'Chat',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        model,
        temperature,
        topP,
        messages,
      },
      inputDefinitions,
      outputDefinitions,
    };

    return new ChatNodeImpl(chartNode);
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
