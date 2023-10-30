import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { type ChatMessage, type ScalarDataValue, getScalarTypeOf, isArrayDataValue } from '../DataValue.js';
import { addWarning } from '../../utils/outputs.js';
import {
  type ChatCompletionOptions,
  type ChatCompletionRequestMessage,
  OpenAIError,
  openAiModelOptions,
  openaiModels,
  streamChatCompletions,
} from '../../utils/openai.js';
import retry from 'p-retry';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { match } from 'ts-pattern';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { getInputOrData, cleanHeaders } from '../../utils/inputs.js';
import { getError } from '../../utils/errors.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { TokenizerCallInfo } from '../../integrations/Tokenizer.js';
import { DEFAULT_CHAT_ENDPOINT } from '../../utils/defaults.js';

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
  enableFunctionUse?: boolean;
  user?: string;
  numberOfChoices?: number;
  endpoint?: string;
  overrideModel?: string;
  overrideMaxTokens?: number;
  headers?: { key: string; value: string }[];
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
  useEndpointInput?: boolean;
  useHeadersInput?: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;

  useAsGraphPartialOutput?: boolean;
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

        enableFunctionUse: false,

        cache: false,
        useAsGraphPartialOutput: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useEndpointInput) {
      inputs.push({
        dataType: 'string',
        id: 'endpoint' as PortId,
        title: 'Endpoint',
      });
    }

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

    if (this.data.useHeadersInput) {
      inputs.push({
        dataType: 'object',
        id: 'headers' as PortId,
        title: 'Headers',
      });
    }

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
    });

    if (this.data.enableFunctionUse) {
      inputs.push({
        dataType: ['gpt-function', 'gpt-function[]'] as const,
        id: 'functions' as PortId,
        title: 'Functions',
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

    if (this.data.enableFunctionUse) {
      outputs.push({
        dataType: 'object',
        id: 'function-call' as PortId,
        title: 'Function Call',
      });
    }

    return outputs;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes a call to an LLM chat model. Currently only supports GPT. The settings contains many options for tweaking the model's behavior.

        The \`System Prompt\` input specifies a system prompt as the first message to the model. This is useful for providing context to the model.

        The \`Prompt\` input takes one or more strings or chat-messages (from a Prompt node) to send to the model.
      `,
      contextMenuTitle: 'Chat',
      infoBoxTitle: 'Chat Node',
      group: ['Common', 'AI'],
    };
  }

  getEditors(): EditorDefinition<ChatNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'GPT Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        options: openAiModelOptions,
        disableIf: (data) => {
          return !!data.overrideModel?.trim();
        },
        helperMessage: (data) => {
          if (data.overrideModel?.trim()) {
            return `Model overridden to: ${data.overrideModel}`;
          }
        },
      },
      {
        type: 'group',
        label: 'Parameters',
        editors: [
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
        ],
      },
      {
        type: 'group',
        label: 'GPT Functions',
        editors: [
          {
            type: 'string',
            label: 'User',
            dataKey: 'user',
            useInputToggleDataKey: 'useUserInput',
          },
          {
            type: 'toggle',
            label: 'Enable Function Use',
            dataKey: 'enableFunctionUse',
          },
        ],
      },
      {
        type: 'group',
        label: 'Advanced',
        editors: [
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
            type: 'string',
            label: 'Endpoint',
            dataKey: 'endpoint',
            useInputToggleDataKey: 'useEndpointInput',
          },
          {
            type: 'string',
            label: 'Custom Model',
            dataKey: 'overrideModel',
          },
          {
            type: 'number',
            label: 'Custom Max Tokens',
            dataKey: 'overrideMaxTokens',
            allowEmpty: true,
          },
          {
            type: 'keyValuePair',
            label: 'Headers',
            dataKey: 'headers',
            useInputToggleDataKey: 'useHeadersInput',
            keyPlaceholder: 'Header',
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
        ],
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    const model = getInputOrData(this.data, inputs, 'model');
    const temperature = getInputOrData(this.data, inputs, 'temperature', 'number');

    const topP = this.data.useTopPInput
      ? coerceTypeOptional(inputs['top_p' as PortId], 'number') ?? this.data.top_p
      : this.data.top_p;

    const useTopP = getInputOrData(this.data, inputs, 'useTopP', 'boolean');
    const stop = this.data.useStopInput
      ? this.data.useStop
        ? coerceTypeOptional(inputs['stop' as PortId], 'string') ?? this.data.stop
        : undefined
      : this.data.stop;

    const presencePenalty = getInputOrData(this.data, inputs, 'presencePenalty', 'number');
    const frequencyPenalty = getInputOrData(this.data, inputs, 'frequencyPenalty', 'number');
    const numberOfChoices = getInputOrData(this.data, inputs, 'numberOfChoices', 'number');
    const endpoint = getInputOrData(this.data, inputs, 'endpoint');
    const overrideModel = getInputOrData(this.data, inputs, 'overrideModel');

    const headersFromData = (this.data.headers ?? []).reduce((acc, header) => {
      acc[header.key] = header.value;
      return acc;
    }, {} as Record<string, string>);
    const additionalHeaders = this.data.useHeadersInput
      ? (coerceTypeOptional(inputs['headers' as PortId], 'object') as Record<string, string> | undefined) ??
        headersFromData
      : headersFromData;

    // If using a model input, that's priority, otherwise override > main
    const finalModel = this.data.useModelInput && inputs['model' as PortId] != null ? model : overrideModel || model;

    const functions = coerceTypeOptional(inputs['functions' as PortId], 'gpt-function[]');

    const { messages } = getChatNodeMessages(inputs);

    const completionMessages = messages.map(
      (message): ChatCompletionRequestMessage => ({
        content: message.message,
        role: message.type,
        name: message.name?.trim() || undefined,
        function_call: message.function_call,
      }),
    );

    let { maxTokens } = this.data;

    const openaiModel = {
      ...(openaiModels[model as keyof typeof openaiModels] ?? {
        maxTokens: this.data.overrideMaxTokens ?? 8192,
        cost: {
          completion: 0,
          prompt: 0,
        },
        displayName: 'Custom Model',
      }),
    };

    if (this.data.overrideMaxTokens) {
      openaiModel.maxTokens = this.data.overrideMaxTokens;
    }

    const isMultiResponse = this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1;

    // Resolve to final endpoint if configured in ProcessContext
    const configuredEndpoint = endpoint || context.settings.openAiEndpoint || DEFAULT_CHAT_ENDPOINT;
    const resolvedEndpointAndHeaders = context.getChatNodeEndpoint
      ? await context.getChatNodeEndpoint(configuredEndpoint, finalModel)
      : {
          endpoint: configuredEndpoint,
          headers: {},
        };

    const allAdditionalHeaders = cleanHeaders({
      ...context.settings.chatNodeHeaders,
      ...additionalHeaders,
      ...resolvedEndpointAndHeaders.headers,
    });

    const tokenizerInfo: TokenizerCallInfo = {
      node: this.chartNode,
      model: finalModel,
      endpoint: resolvedEndpointAndHeaders.endpoint,
    };
    const tokenCount = context.tokenizer.getTokenCountForMessages(messages, tokenizerInfo);

    console.dir({ tokenCount, openaiModel });
    if (tokenCount >= openaiModel.maxTokens) {
      throw new Error(
        `The model ${model} can only handle ${openaiModel.maxTokens} tokens, but ${tokenCount} were provided in the prompts alone.`,
      );
    }

    if (tokenCount + maxTokens > openaiModel.maxTokens) {
      const message = `The model can only handle a maximum of ${
        openaiModel.maxTokens
      } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
        openaiModel.maxTokens - tokenCount
      }.`;
      addWarning(output, message);
      maxTokens = Math.floor((openaiModel.maxTokens - tokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
    }

    try {
      return await retry(
        async () => {
          const options: Omit<ChatCompletionOptions, 'auth' | 'signal'> = {
            messages: completionMessages,
            model: finalModel,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens: maxTokens,
            n: numberOfChoices,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            stop: stop || undefined,
            functions: functions?.length === 0 ? undefined : functions,
            endpoint: resolvedEndpointAndHeaders.endpoint,
          };
          const cacheKey = JSON.stringify(options);

          if (this.data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }

          const startTime = Date.now();

          const chunks = streamChatCompletions({
            auth: {
              apiKey: context.settings.openAiKey ?? '',
              organization: context.settings.openAiOrganization,
            },
            headers: allAdditionalHeaders,
            signal: context.signal,
            timeout: context.settings.chatNodeTimeout,
            ...options,
          });

          const responseChoicesParts: string[][] = [];
          const functionCalls: {
            name: string;
            arguments: string;
            lastParsedArguments?: unknown;
          }[] = [];

          for await (const chunk of chunks) {
            if (!chunk.choices) {
              // Could be error for some reason 🤷‍♂️ but ignoring has worked for me so far.
              continue;
            }

            for (const { delta, index } of chunk.choices) {
              if (delta.content != null) {
                responseChoicesParts[index] ??= [];
                responseChoicesParts[index]!.push(delta.content);
              }

              if (delta.function_call) {
                functionCalls[index] ??= {
                  name: '',
                  arguments: '',
                  lastParsedArguments: undefined,
                };

                if (delta.function_call.name) {
                  functionCalls[index]!.name += delta.function_call.name;
                }

                if (delta.function_call.arguments) {
                  functionCalls[index]!.arguments += delta.function_call.arguments;

                  try {
                    functionCalls[index]!.lastParsedArguments = JSON.parse(functionCalls[index]!.arguments);
                  } catch (error) {
                    // Ignore
                  }
                }
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

            if (functionCalls.length > 0) {
              if (isMultiResponse) {
                output['function-call' as PortId] = {
                  type: 'object[]',
                  value: functionCalls.map((functionCall) => ({
                    name: functionCall.name,
                    arguments: functionCall.lastParsedArguments,
                  })),
                };
              } else {
                output['function-call' as PortId] = {
                  type: 'object',
                  value: {
                    name: functionCalls[0]!.name,
                    arguments: functionCalls[0]!.lastParsedArguments,
                  } as Record<string, unknown>,
                };
              }
            }

            context.onPartialOutputs?.(output);
          }

          const endTime = Date.now();

          if (responseChoicesParts.length === 0 && functionCalls.length === 0) {
            throw new Error('No response from OpenAI');
          }

          output['requestTokens' as PortId] = { type: 'number', value: tokenCount * numberOfChoices };

          const responseTokenCount = responseChoicesParts
            .map((choiceParts) => context.tokenizer.getTokenCountForString(choiceParts.join(), tokenizerInfo))
            .reduce((a, b) => a + b, 0);

          output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };

          const promptCostPerThousand =
            model in openaiModels ? openaiModels[model as keyof typeof openaiModels].cost.prompt : 0;
          const completionCostPerThousand =
            model in openaiModels ? openaiModels[model as keyof typeof openaiModels].cost.completion : 0;

          const promptCost = getCostForTokens(tokenCount, 'prompt', promptCostPerThousand);
          const completionCost = getCostForTokens(responseTokenCount, 'completion', completionCostPerThousand);

          const cost = promptCost + completionCost;

          output['cost' as PortId] = { type: 'number', value: cost };
          output['__hidden_token_count' as PortId] = { type: 'number', value: tokenCount + responseTokenCount };

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
            if (err.toString().includes('fetch failed') && err.cause) {
              const cause =
                getError(err.cause) instanceof AggregateError
                  ? (err.cause as AggregateError).errors[0]
                  : getError(err.cause);

              err = cause;
            }

            context.trace(`ChatNode failed, retrying: ${err.toString()}`);

            if (context.signal.aborted) {
              throw new Error('Aborted');
            }

            const { retriesLeft } = err;

            if (!(err instanceof OpenAIError)) {
              if ('code' in err) {
                throw err;
              }

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

  let messages: ChatMessage[] = match(prompt)
    .with({ type: 'chat-message' }, (p) => [p.value])
    .with({ type: 'chat-message[]' }, (p) => p.value)
    .with({ type: 'string' }, (p): ChatMessage[] => [
      { type: 'user', message: p.value, function_call: undefined, name: undefined },
    ])
    .with({ type: 'string[]' }, (p): ChatMessage[] =>
      p.value.map((v) => ({ type: 'user', message: v, function_call: undefined, name: undefined })),
    )
    .otherwise((p): ChatMessage[] => {
      if (!p) {
        return [];
      }

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
          .map((v) => ({ type: 'user', message: v, function_call: undefined, name: undefined }));
      }

      const coercedMessage = coerceTypeOptional(p, 'chat-message');
      if (coercedMessage != null) {
        return [coercedMessage];
      }

      const coercedString = coerceTypeOptional(p, 'string');
      return coercedString != null
        ? [{ type: 'user', message: coerceType(p, 'string'), function_call: undefined, name: undefined }]
        : [];
    });

  const systemPrompt = inputs['systemPrompt' as PortId];
  if (systemPrompt) {
    messages = [
      { type: 'system', message: coerceType(systemPrompt, 'string'), function_call: undefined, name: undefined },
      ...messages,
    ];
  }

  return { messages, systemPrompt };
}

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', costPerThousand: number) {
  return (tokenCount / 1000) * costPerThousand;
}
