import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { ChatMessage, GptTool, ScalarDataValue, getScalarTypeOf, isArrayDataValue } from '../DataValue';
import {
  assertValidModel,
  getCostForPrompt,
  getCostForTokens,
  getTokenCountForMessages,
  getTokenCountForString,
  modelMaxTokens,
  modelOptions,
  modelToTiktokenModel,
} from '../../utils/tokenizer';
import { addWarning } from '../../utils/outputs';
import {
  ChatCompletionOptions,
  ChatCompletionRequestMessage,
  ChatCompletionToolNamespace,
  OpenAIError,
  streamChatCompletions,
} from '../../utils/openai';
import retry from 'p-retry';
import { Inputs, Outputs } from '../GraphProcessor';
import { match } from 'ts-pattern';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType';
import { InternalProcessContext } from '../ProcessContext';
import { ChatCompletionToolMap } from '../../utils/openai';
import { expectTypeOptional, getError } from '../..';

export type ChatNode = ChartNode<'chat', ChatNodeData>;

export type ChatNodeConfigData = {
  model: string;
  temperature: number;
  useTopP: boolean;
  top_p?: number;
  maxTokens: number;
  stop?: string;
  presencePenalty?: number;
  frequencyPenalty?: number;
  enableToolUse?: boolean;
  user?: string;
  numberOfChoices?: number;
};

export type ChatNodeData = ChatNodeConfigData & {
  useModelInput: boolean;
  useTemperatureInput: boolean;
  useTopPInput: boolean;
  useTopP: boolean;
  useUseTopPInput: boolean;
  useMaxTokensInput: boolean;
  useStop: boolean;
  useStopInput: boolean;
  usePresencePenaltyInput: boolean;
  useFrequencyPenaltyInput: boolean;
  useUserInput?: boolean;
  useNumberOfChoicesInput?: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;
};

// Temporary
const cache = new Map<string, Outputs>();

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

        user: undefined,
        useUserInput: false,

        enableToolUse: false,

        cache: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'systemPrompt' as PortId,
      title: 'System Prompt',
      dataType: 'string',
      required: false,
    });

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

    if (this.data.usePresencePenaltyInput) {
      inputs.push({
        dataType: 'number',

        id: 'presencePenalty' as PortId,
        title: 'Presence Penalty',
      });
    }

    if (this.data.useFrequencyPenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'frequencyPenalty' as PortId,
        title: 'Frequency Penalty',
      });
    }

    if (this.data.useUserInput) {
      inputs.push({
        dataType: 'string',
        id: 'user' as PortId,
        title: 'User',
      });
    }

    if (this.data.useNumberOfChoicesInput) {
      inputs.push({
        dataType: 'number',
        id: 'numberOfChoices' as PortId,
        title: 'Number of Choices',
      });
    }

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
    });

    if (this.data.enableToolUse) {
      inputs.push({
        dataType: ['gpt-tool', 'gpt-tool[]'] as const,
        id: 'tools' as PortId,
        title: 'Tools',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    if (this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1) {
      outputs.push({
        dataType: 'string[]',
        id: 'response' as PortId,
        title: 'Responses',
      });
    } else {
      outputs.push({
        dataType: 'string',
        id: 'response' as PortId,
        title: 'Response',
      });
    }

    if (this.data.enableToolUse) {
      outputs.push({
        dataType: 'object',
        id: 'tool-call' as PortId,
        title: 'Tool Call',
      });
    }

    return outputs;
  }

  getEditors(): EditorDefinition<ChatNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        options: modelOptions,
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
        type: 'number',
        label: 'Presence Penalty',
        dataKey: 'presencePenalty',
        useInputToggleDataKey: 'usePresencePenaltyInput',
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        type: 'number',
        label: 'Frequency Penalty',
        dataKey: 'frequencyPenalty',
        useInputToggleDataKey: 'useFrequencyPenaltyInput',
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        type: 'string',
        label: 'User',
        dataKey: 'user',
        useInputToggleDataKey: 'useUserInput',
      },
      {
        type: 'number',
        label: 'Number of Choices',
        dataKey: 'numberOfChoices',
        useInputToggleDataKey: 'useNumberOfChoicesInput',
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 1,
      },
      {
        type: 'toggle',
        label: 'Enable Tool Use',
        dataKey: 'enableToolUse',
      },
      {
        type: 'toggle',
        label: 'Cache (same inputs, same outputs)',
        dataKey: 'cache',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    const model = this.data.useModelInput
      ? coerceTypeOptional(inputs['model' as PortId], 'string') ?? this.data.model
      : this.data.model;

    assertValidModel(model);

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

    const presencePenalty = this.data.usePresencePenaltyInput
      ? coerceTypeOptional(inputs['presencePenalty' as PortId], 'number') ?? this.data.presencePenalty
      : this.data.presencePenalty;

    const frequencyPenalty = this.data.useFrequencyPenaltyInput
      ? coerceTypeOptional(inputs['frequencyPenalty' as PortId], 'number') ?? this.data.frequencyPenalty
      : this.data.frequencyPenalty;

    const numberOfChoices = this.data.useNumberOfChoicesInput
      ? coerceTypeOptional(inputs['numberOfChoices' as PortId], 'number') ?? this.data.numberOfChoices ?? 1
      : this.data.numberOfChoices ?? 1;

    const tools = expectTypeOptional(inputs['tools' as PortId], 'gpt-tool[]');

    const toolMap = (tools ?? []).reduce((acc, tool): ChatCompletionToolMap => {
      if (tool.namespace) {
        const existing = (acc[tool.namespace] as ChatCompletionToolNamespace) ?? {};
        const namespace: ChatCompletionToolNamespace = {
          ...existing,

          // TODO
          description: tool.namespace,
          tools: {
            ...existing.tools,
            [tool.name]: {
              type: 'tool',
              description: tool.description,
              schema: tool.schema,
            },
          },
        };
        return {
          ...acc,
          [tool.namespace]: namespace,
        };
      } else {
        return {
          ...acc,

          [tool.name]: {
            type: 'tool',
            description: tool.description,
            schema: tool.schema,
          },
        };
      }
    }, {} as ChatCompletionToolMap);

    const { messages } = getChatNodeMessages(inputs);

    const completionMessages = messages.map(
      (message): ChatCompletionRequestMessage => ({
        content: message.message,
        role: message.type,
      }),
    );

    let { maxTokens } = this.data;

    const tokenCount = getTokenCountForMessages(completionMessages, modelToTiktokenModel[model]);

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

    const isMultiResponse = this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1;

    try {
      return await retry(
        async () => {
          const options: Omit<ChatCompletionOptions, 'auth' | 'signal'> = {
            messages: completionMessages,
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens: maxTokens,
            n: numberOfChoices,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            stop: stop || undefined,
            tools: Object.keys(toolMap).length === 0 ? undefined : toolMap,
            format: this.data.enableToolUse ? 'merged' : undefined,
          };
          const cacheKey = JSON.stringify(options);

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
            signal: context.signal,
            ...options,
          });

          let responseChoicesParts: string[][] = [];
          let toolCallChoicesParts: string[][] = [];

          for await (const chunk of chunks) {
            for (const { delta, index } of chunk.choices) {
              if (delta.content != null) {
                responseChoicesParts[index] ??= [];
                responseChoicesParts[index]!.push(delta.content);
              }

              if (delta.tool_call) {
                toolCallChoicesParts[index] ??= [];
                toolCallChoicesParts[index]!.push(delta.tool_call);
              }
            }

            if (isMultiResponse) {
              output['response' as PortId] = {
                type: 'string[]',
                value: responseChoicesParts.map((parts) => parts.join('')),
              };
            } else {
              output['response' as PortId] = {
                type: 'string',
                value: responseChoicesParts[0]?.join('') ?? '',
              };
            }

            if (toolCallChoicesParts.length > 0) {
              try {
                if (isMultiResponse) {
                  const toolCallJsons = toolCallChoicesParts.map((choiceParts) => JSON.parse(choiceParts.join('')));
                  output['tool-call' as PortId] = {
                    type: 'object[]',
                    value: toolCallJsons,
                  };
                } else {
                  const toolCallJson = JSON.parse(toolCallChoicesParts[0]?.join('') ?? '');
                  output['tool-call' as PortId] = {
                    type: 'object',
                    value: toolCallJson,
                  };
                }
              } catch (err) {
                if (isMultiResponse) {
                  output['tool-call' as PortId] = {
                    type: 'string[]',
                    value: toolCallChoicesParts.map((parts) => parts.join('')),
                  };
                } else {
                  output['tool-call' as PortId] = {
                    type: 'string',
                    value: toolCallChoicesParts[0]?.join('') ?? '',
                  };
                }
              }
            }

            context.onPartialOutputs?.(output);
          }

          if (responseChoicesParts.length === 0 && toolCallChoicesParts.length === 0) {
            throw new Error('No response from OpenAI');
          }

          const requestTokenCount = getTokenCountForMessages(completionMessages, modelToTiktokenModel[model]);
          output['requestTokens' as PortId] = { type: 'number', value: requestTokenCount * numberOfChoices };

          const responseTokenCount = responseChoicesParts
            .map((choiceParts) => getTokenCountForString(choiceParts.join(), modelToTiktokenModel[model]))
            .reduce((a, b) => a + b, 0);

          output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };

          const cost =
            getCostForPrompt(completionMessages, model) + getCostForTokens(responseTokenCount, 'completion', model);

          output['cost' as PortId] = { type: 'number', value: cost };

          Object.freeze(output);
          cache.set(cacheKey, output);

          return output;
        },
        {
          forever: true,
          maxRetryTime: 1000 * 60 * 5,
          factor: 2.5,
          minTimeout: 500,
          maxTimeout: 5000,
          randomize: true,
          signal: context.signal,
          onFailedAttempt(err) {
            context.trace(`ChatNode failed, retrying: ${err.toString()}`);

            const { retriesLeft } = err;

            if (!(err instanceof OpenAIError)) {
              return; // Just retry?
            }

            if (err.status === 429) {
              if (retriesLeft) {
                context.onPartialOutputs?.({
                  ['response' as PortId]: {
                    type: 'string',
                    value: 'OpenAI API rate limit exceeded, retrying...',
                  },
                });
                return;
              }
            }

            // We did something wrong (besides rate limit)
            if (err.status >= 400 && err.status < 500) {
              throw new Error(err.message);
            }
          },
        },
      );
    } catch (error) {
      context.trace(getError(error).stack ?? 'Missing stack');
      throw new Error(`Error processing ChatNode: ${(error as Error).message}`);
    }
  }
}

export const chatNode = nodeDefinition(ChatNodeImpl, 'Chat');

export function getChatNodeMessages(inputs: Inputs) {
  const prompt = inputs['prompt' as PortId];
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  let messages: ChatMessage[] = match(prompt)
    .with({ type: 'chat-message' }, (p) => [p.value])
    .with({ type: 'chat-message[]' }, (p) => p.value)
    .with({ type: 'string' }, (p): ChatMessage[] => [{ type: 'user', message: p.value }])
    .with({ type: 'string[]' }, (p): ChatMessage[] => p.value.map((v) => ({ type: 'user', message: v })))
    .otherwise((p) => {
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

        return stringValues.filter((v) => v != null).map((v) => ({ type: 'user', message: v }));
      }

      const coercedMessage = coerceType(p, 'chat-message');
      if (coercedMessage != null) {
        return [coercedMessage];
      }

      const coercedString = coerceType(p, 'string');
      return coercedString != null ? [{ type: 'user', message: coerceType(p, 'string') }] : [];
    });

  const systemPrompt = inputs['systemPrompt' as PortId];
  if (systemPrompt) {
    messages = [{ type: 'system', message: coerceType(systemPrompt, 'string') }, ...messages];
  }

  return { messages, systemPrompt };
}