import {
  ChartNode,
  ChatMessage,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PortId,
  ScalarDataValue,
  addWarning,
  coerceType,
  coerceTypeOptional,
  defaultTokenizer,
  expectTypeOptional,
  getError,
  getScalarTypeOf,
  isArrayDataValue,
  nodeDefinition,
} from '../../../index.js';
import {
  AnthropicModels,
  ChatCompletionOptions,
  anthropicModelOptions,
  anthropicModels,
  streamChatCompletions,
} from '../anthropic.js';
import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import retry from 'p-retry';
import { match } from 'ts-pattern';

export type ChatAnthropicNode = ChartNode<'chatAnthropic', ChatAnthropicNodeData>;

export type ChatAnthropicNodeConfigData = {
  model: AnthropicModels;
  temperature: number;
  useTopP: boolean;
  top_p?: number;
  top_k?: number;
  maxTokens: number;
  stop?: string;
};

export type ChatAnthropicNodeData = ChatAnthropicNodeConfigData & {
  useModelInput: boolean;
  useTemperatureInput: boolean;
  useTopPInput: boolean;
  useTopKInput: boolean;
  useUseTopPInput: boolean;
  useMaxTokensInput: boolean;
  useStop: boolean;
  useStopInput: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;

  useAsGraphPartialOutput?: boolean;
};

// Temporary
const cache = new Map<string, Outputs>();

export class ChatAnthropicNodeImpl extends NodeImpl<ChatAnthropicNode> {
  static create(): ChatAnthropicNode {
    const chartNode: ChatAnthropicNode = {
      type: 'chatAnthropic',
      title: 'Chat (Anthropic)',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 275,
      },
      data: {
        model: 'claude-2',
        useModelInput: false,

        temperature: 0.5,
        useTemperatureInput: false,

        top_p: 1,
        useTopPInput: false,

        top_k: undefined,
        useTopKInput: false,

        useTopP: false,
        useUseTopPInput: false,

        maxTokens: 1024,
        useMaxTokensInput: false,

        useStop: false,
        stop: '',
        useStopInput: false,

        cache: false,
        useAsGraphPartialOutput: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
      });
    }

    if (this.data.useTemperatureInput) {
      inputs.push({
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
      });
    }

    if (this.data.useTopPInput) {
      inputs.push({
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
      });
    }

    if (this.data.useUseTopPInput) {
      inputs.push({
        dataType: 'boolean',
        id: 'useTopP' as PortId,
        title: 'Use Top P',
      });
    }

    if (this.data.useMaxTokensInput) {
      inputs.push({
        dataType: 'number',
        id: 'maxTokens' as PortId,
        title: 'Max Tokens',
      });
    }

    if (this.data.useStopInput) {
      inputs.push({
        dataType: 'string',
        id: 'stop' as PortId,
        title: 'Stop',
      });
    }

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
    });

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      dataType: 'string',
      id: 'response' as PortId,
      title: 'Response',
    });

    return outputs;
  }

  getEditors(): EditorDefinition<ChatAnthropicNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        options: anthropicModelOptions,
      },
      {
        type: 'number',
        label: 'Temperature',
        dataKey: 'temperature',
        useInputToggleDataKey: 'useTemperatureInput',
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        type: 'number',
        label: 'Top P',
        dataKey: 'top_p',
        useInputToggleDataKey: 'useTopPInput',
        min: 0,
        max: 1,
        step: 0.1,
      },
      {
        type: 'toggle',
        label: 'Use Top P',
        dataKey: 'useTopP',
        useInputToggleDataKey: 'useUseTopPInput',
      },
      {
        type: 'number',
        label: 'Max Tokens',
        dataKey: 'maxTokens',
        useInputToggleDataKey: 'useMaxTokensInput',
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
      },
      {
        type: 'string',
        label: 'Stop',
        dataKey: 'stop',
        useInputToggleDataKey: 'useStopInput',
      },
      {
        type: 'toggle',
        label: 'Cache (same inputs, same outputs)',
        dataKey: 'cache',
      },
      {
        type: 'toggle',
        label: 'Use for subgraph partial output',
        dataKey: 'useAsGraphPartialOutput',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes a call to an Anthropic chat model. The settings contains many options for tweaking the model's behavior.
      `,
      infoBoxTitle: 'Chat (Anthropic) Node',
      contextMenuTitle: 'Chat (Anthropic)',
      group: ['AI'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    const rawModel = this.data.useModelInput
      ? coerceTypeOptional(inputs['model' as PortId], 'string') ?? this.data.model
      : this.data.model;

    const model = rawModel as AnthropicModels;

    const temperature = this.data.useTemperatureInput
      ? coerceTypeOptional(inputs['temperature' as PortId], 'number') ?? this.data.temperature
      : this.data.temperature;

    const topP = this.data.useTopPInput
      ? coerceTypeOptional(inputs['top_p' as PortId], 'number') ?? this.data.top_p
      : this.data.top_p;

    const useTopP = this.data.useUseTopPInput
      ? coerceTypeOptional(inputs['useTopP' as PortId], 'boolean') ?? this.data.useTopP
      : this.data.useTopP;

    const stop = this.data.useStopInput
      ? this.data.useStop
        ? coerceTypeOptional(inputs['stop' as PortId], 'string') ?? this.data.stop
        : undefined
      : this.data.stop;

    const functions = expectTypeOptional(inputs['functions' as PortId], 'gpt-function[]');

    const { messages } = getChatAnthropicNodeMessages(inputs);

    let prompt = messages.reduce((acc, message) => {
      if (message.type === 'user') {
        return `${acc}\n\nHuman: ${message.message}`;
      } else if (message.type === 'assistant') {
        return `${acc}\n\nAssistant: ${message.message}`;
      }
      return acc;
    }, '');

    prompt += '\n\nAssistant:';

    let { maxTokens } = this.data;

    const tokenCount = defaultTokenizer.getTokenCountForString(prompt);

    if (tokenCount >= anthropicModels[model].maxTokens) {
      throw new Error(
        `The model ${model} can only handle ${anthropicModels[model].maxTokens} tokens, but ${tokenCount} were provided in the prompts alone.`,
      );
    }

    if (tokenCount + maxTokens > anthropicModels[model].maxTokens) {
      const message = `The model can only handle a maximum of ${
        anthropicModels[model].maxTokens
      } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
        anthropicModels[model].maxTokens - tokenCount
      }.`;
      addWarning(output, message);
      maxTokens = Math.floor((anthropicModels[model].maxTokens - tokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
    }

    try {
      return await retry(
        async () => {
          const options: Omit<ChatCompletionOptions, 'apiKey' | 'signal'> = {
            prompt,
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens_to_sample: maxTokens,
            stop_sequences: stop ? [stop] : undefined,
          };
          const cacheKey = JSON.stringify(options);

          if (this.data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }

          const startTime = Date.now();

          const apiKey = context.getPluginConfig('anthropicApiKey');

          const chunks = streamChatCompletions({
            apiKey: apiKey ?? '',
            signal: context.signal,
            ...options,
          });

          const responseParts: string[] = [];

          for await (const chunk of chunks) {
            if (!chunk.completion) {
              // Could be error for some reason 🤷‍♂️ but ignoring has worked for me so far.
              continue;
            }

            responseParts.push(chunk.completion);

            output['response' as PortId] = {
              type: 'string',
              value: responseParts.join('').trim(),
            };

            context.onPartialOutputs?.(output);
          }

          const endTime = Date.now();

          if (responseParts.length === 0) {
            throw new Error('No response from Anthropic');
          }

          const requestTokenCount = defaultTokenizer.getTokenCountForString(prompt);
          output['requestTokens' as PortId] = { type: 'number', value: requestTokenCount };

          const responseTokenCount = defaultTokenizer.getTokenCountForString(responseParts.join(''));
          output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };

          // TODO
          // const cost =
          //   getCostForPrompt(completionMessages, model) + getCostForTokens(responseTokenCount, 'completion', model);

          // output['cost' as PortId] = { type: 'number', value: cost };

          const duration = endTime - startTime;

          output['duration' as PortId] = { type: 'number', value: duration };

          Object.freeze(output);
          cache.set(cacheKey, output);

          return output;
        },
        {
          forever: true,
          retries: 10000,
          maxRetryTime: 1000 * 60 * 5,
          factor: 2.5,
          minTimeout: 500,
          maxTimeout: 5000,
          randomize: true,
          signal: context.signal,
          onFailedAttempt(err) {
            context.trace(`ChatAnthropicNode failed, retrying: ${err.toString()}`);

            if (context.signal.aborted) {
              throw new Error('Aborted');
            }

            const { retriesLeft } = err;

            // TODO
            // if (!(err instanceof OpenAIError)) {
            //   return; // Just retry?
            // }

            // if (err.status === 429) {
            //   if (retriesLeft) {
            //     context.onPartialOutputs?.({
            //       ['response' as PortId]: {
            //         type: 'string',
            //         value: 'OpenAI API rate limit exceeded, retrying...',
            //       },
            //     });
            //     return;
            //   }
            // }

            // // We did something wrong (besides rate limit)
            // if (err.status >= 400 && err.status < 500) {
            //   throw new Error(err.message);
            // }
          },
        },
      );
    } catch (error) {
      context.trace(getError(error).stack ?? 'Missing stack');
      throw new Error(`Error processing ChatAnthropicNode: ${(error as Error).message}`);
    }
  }
}

export const chatAnthropicNode = nodeDefinition(ChatAnthropicNodeImpl, 'Chat');

export function getChatAnthropicNodeMessages(inputs: Inputs) {
  const prompt = inputs['prompt' as PortId];
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const messages: ChatMessage[] = match(prompt)
    .with({ type: 'chat-message' }, (p) => [p.value])
    .with({ type: 'chat-message[]' }, (p) => p.value)
    .with({ type: 'string' }, (p): ChatMessage[] => [{ type: 'user', message: p.value, function_call: undefined }])
    .with({ type: 'string[]' }, (p): ChatMessage[] =>
      p.value.map((v) => ({ type: 'user', message: v, function_call: undefined })),
    )
    .otherwise((p): ChatMessage[] => {
      if (isArrayDataValue(p)) {
        const stringValues = (p.value as readonly unknown[]).map((v) =>
          coerceType(
            {
              type: getScalarTypeOf(p.type),
              value: v,
            } as ScalarDataValue,
            'string',
          ),
        );

        return stringValues
          .filter((v) => v != null)
          .map((v) => ({ type: 'user', message: v, function_call: undefined }));
      }

      const coercedMessage = coerceType(p, 'chat-message');
      if (coercedMessage != null) {
        return [coercedMessage];
      }

      const coercedString = coerceType(p, 'string');
      return coercedString != null
        ? [{ type: 'user', message: coerceType(p, 'string'), function_call: undefined }]
        : [];
    });
  return { messages };
}
