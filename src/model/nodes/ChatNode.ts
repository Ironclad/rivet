import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { InternalProcessContext, NodeImpl, ProcessContext } from '../NodeImpl';
import { DataValue, expectTypeOptional } from '../DataValue';
import {
  assertValidModel,
  getCostForPrompt,
  getCostForTokens,
  getTokenCountForMessages,
  getTokenCountForString,
  modelMaxTokens,
  modelToTiktokenModel,
} from '../../utils/tokenizer';
import { addWarning } from '../../utils/outputs';
import { ChatCompletionRequestMessage, streamChatCompletions } from '../../utils/openai';
import retry from 'p-retry';
import { Inputs, Outputs } from '../GraphProcessor';

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

  useStop: boolean;
  stop: string;
  useStopInput: boolean;

  presencePenalty: number;
  usePresencePenaltyInput: boolean;

  frequencyPenalty: number;
  useFrequencyPenaltyInput: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;
};

// Temporary
const cache = new Map<string, Record<PortId, DataValue>>();

export class ChatNodeImpl extends NodeImpl<ChatNode> {
  static create(): ChatNode {
    const chartNode: ChatNode = {
      type: 'chat',
      title: 'Chat',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
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

        useStop: false,
        stop: '',
        useStopInput: false,

        presencePenalty: 0,
        usePresencePenaltyInput: false,

        frequencyPenalty: 0,
        useFrequencyPenaltyInput: false,

        cache: false,
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

    if (this.chartNode.data.useUseTopPInput) {
      inputs.push({
        dataType: 'boolean',
        id: 'useTopP' as PortId,
        title: 'Use Top P',
      });
    }

    if (this.chartNode.data.useMaxTokensInput) {
      inputs.push({
        dataType: 'number',
        id: 'maxTokens' as PortId,
        title: 'Max Tokens',
      });
    }

    if (this.chartNode.data.useStopInput) {
      inputs.push({
        dataType: 'string',
        id: 'stop' as PortId,
        title: 'Stop',
      });
    }

    if (this.chartNode.data.usePresencePenaltyInput) {
      inputs.push({
        dataType: 'number',

        id: 'presencePenalty' as PortId,
        title: 'Presence Penalty',
      });
    }

    if (this.chartNode.data.useFrequencyPenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'frequencyPenalty' as PortId,
        title: 'Frequency Penalty',
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

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    console.dir({ inputs });
    const output: Outputs = {};

    const model = expectTypeOptional(inputs['model' as PortId], 'string') ?? this.chartNode.data.model;
    assertValidModel(model);

    const temperature =
      expectTypeOptional(inputs['temperature' as PortId], 'number') ?? this.chartNode.data.temperature;
    const topP = expectTypeOptional(inputs['top_p' as PortId], 'number') ?? this.chartNode.data.top_p;
    const useTopP = expectTypeOptional(inputs['useTopP' as PortId], 'boolean') ?? this.chartNode.data.useTopP;
    const stop = this.data.useStop
      ? expectTypeOptional(inputs['stop' as PortId], 'string') ?? this.chartNode.data.stop
      : undefined;
    const presencePenalty =
      expectTypeOptional(inputs['presencePenalty' as PortId], 'number') ?? this.chartNode.data.presencePenalty;
    const frequencyPenalty =
      expectTypeOptional(inputs['frequencyPenalty' as PortId], 'number') ?? this.chartNode.data.frequencyPenalty;

    const messages: ChatCompletionRequestMessage[] = [];
    let { maxTokens } = this.chartNode.data;

    for (const key in inputs) {
      if (key.startsWith('message')) {
        const inputMessage = inputs[key as PortId];
        if (inputMessage?.type === 'chat-message') {
          messages.push({ role: inputMessage.value.type, content: inputMessage.value.message });
        } else if (inputMessage?.type === 'string') {
          messages.push({ role: 'user', content: inputMessage.value });
        }
      }
    }

    const tokenCount = getTokenCountForMessages(messages, modelToTiktokenModel[model]);

    if (tokenCount >= modelMaxTokens[model]) {
      throw new Error(
        `The model ${model} can only handle ${modelMaxTokens[model]} tokens, but ${tokenCount} were provided in the prompts alone.`,
      );
    }

    if (tokenCount + maxTokens > modelMaxTokens[model]) {
      const message = `The model can only handle a maximum of ${
        modelMaxTokens[model]
      } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
        modelMaxTokens[model] - tokenCount
      }.`;
      addWarning(output, message);
      maxTokens = Math.floor((modelMaxTokens[model] - tokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
    }

    try {
      return await retry(
        async () => {
          const cacheKey = JSON.stringify({
            messages,
            model,
            temperature: useTopP ? undefined : temperature,
            topP: useTopP ? topP : undefined,
            maxTokens,
            frequencyPenalty,
            presencePenalty,
            stop,
          });

          if (this.data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }

          const chunks = streamChatCompletions({
            auth: {
              apiKey: context.settings.openAiKey,
              organization: context.settings.openAiOrganization,
            },
            messages,
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens: maxTokens,
            n: 1,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            stop,
            signal: context.signal,
          });

          let responseParts: string[] = [];

          for await (const chunk of chunks) {
            responseParts.push(chunk);

            output['response' as PortId] = {
              type: 'string',
              value: responseParts.join(''),
            };

            context.onPartialOutputs?.(output);
          }

          const requestTokenCount = getTokenCountForMessages(messages, model);
          output['requestTokens' as PortId] = { type: 'number', value: requestTokenCount };

          const responseTokenCount = getTokenCountForString(responseParts.join(), model);
          output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };

          const cost = getCostForPrompt(messages, model) + getCostForTokens(responseTokenCount, 'completion', model);

          output['cost' as PortId] = { type: 'number', value: cost };

          Object.freeze(output);
          cache.set(cacheKey, output);

          return output;
        },
        {
          retries: 4,
          signal: context.signal,
          onFailedAttempt(error) {
            console.log(error);
          },
        },
      );
    } catch (error) {
      console.error('Error processing ChatNode:', error);
      throw new Error(`Error processing ChatNode: ${(error as Error).message}`);
    }
  }
}
