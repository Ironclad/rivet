import {
  uint8ArrayToBase64,
  type ChartNode,
  type ChatMessage,
  type EditorDefinition,
  type Inputs,
  type InternalProcessContext,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type NodeUIData,
  type Outputs,
  type PluginNodeImpl,
  type PortId,
  type ScalarDataValue,
  type ChatMessageMessagePart,
} from '../../../index.js';
import {
  type AnthropicModels,
  type ChatCompletionOptions,
  anthropicModelOptions,
  anthropicModels,
  streamChatCompletions,
  AnthropicError,
  type Claude3ChatMessage,
  type Claude3ChatMessageContentPart,
  streamMessageApi,
  type ChatMessageOptions
} from '../anthropic.js';
import { nanoid } from 'nanoid/non-secure';
import { dedent } from 'ts-dedent';
import retry from 'p-retry';
import { match } from 'ts-pattern';
import { coerceType, coerceTypeOptional } from '../../../utils/coerceType.js';
import { addWarning } from '../../../utils/outputs.js';
import { getError } from '../../../utils/errors.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { getScalarTypeOf, isArrayDataValue } from '../../../model/DataValue.js';
import type { TokenizerCallInfo } from '../../../integrations/Tokenizer.js';
import { assertNever } from '../../../utils/assertNever.js';
import { isNotNull } from '../../../utils/genericUtilFunctions.js';

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

export const ChatAnthropicNodeImpl: PluginNodeImpl<ChatAnthropicNode> = {
  create(): ChatAnthropicNode {
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
  },

  getInputDefinitions(data): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
      });
    }

    if (data.useTemperatureInput) {
      inputs.push({
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
      });
    }

    if (data.useTopPInput) {
      inputs.push({
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
      });
    }

    if (data.useUseTopPInput) {
      inputs.push({
        dataType: 'boolean',
        id: 'useTopP' as PortId,
        title: 'Use Top P',
      });
    }

    if (data.useMaxTokensInput) {
      inputs.push({
        dataType: 'number',
        id: 'maxTokens' as PortId,
        title: 'Max Tokens',
      });
    }

    if (data.useStopInput) {
      inputs.push({
        dataType: 'string',
        id: 'stop' as PortId,
        title: 'Stop',
      });
    }

    if (data.model.startsWith('claude-3')) {
      inputs.push({
        dataType: 'string',
        id: 'system' as PortId,
        title: 'System Prompt',
      });
    }

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
    });

    return inputs;
  },

  getOutputDefinitions(_data): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      dataType: 'string',
      id: 'response' as PortId,
      title: 'Response',
    });

    return outputs;
  },

  getBody(data): string {
    const modelName = anthropicModels[data.model]?.displayName ?? 'Unknown Model';
    return dedent`
      ${modelName}
      ${
        data.useTopP
          ? `Top P: ${data.useTopPInput ? '(Using Input)' : data.top_p}`
          : `Temperature: ${data.useTemperatureInput ? '(Using Input)' : data.temperature}`
      }
      Max Tokens: ${data.maxTokens}
      ${data.useStop ? `Stop: ${data.useStopInput ? '(Using Input)' : data.stop}` : ''}
    `;
  },

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
  },

  getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes a call to an Anthropic chat model. The settings contains many options for tweaking the model's behavior.
      `,
      infoBoxTitle: 'Chat (Anthropic) Node',
      contextMenuTitle: 'Chat (Anthropic)',
      group: ['AI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};
    const rawModel = data.useModelInput
      ? coerceTypeOptional(inputs['model' as PortId], 'string') ?? data.model
      : data.model;
    const model = rawModel as AnthropicModels;
    const temperature = data.useTemperatureInput
      ? coerceTypeOptional(inputs['temperature' as PortId], 'number') ?? data.temperature
      : data.temperature;
    const topP = data.useTopPInput ? coerceTypeOptional(inputs['top_p' as PortId], 'number') ?? data.top_p : data.top_p;
    const useTopP = data.useUseTopPInput
      ? coerceTypeOptional(inputs['useTopP' as PortId], 'boolean') ?? data.useTopP
      : data.useTopP;
    const stop = data.useStopInput
      ? data.useStop
        ? coerceTypeOptional(inputs['stop' as PortId], 'string') ?? data.stop
        : undefined
      : data.stop;
    const { messages } = await getChatAnthropicNodeMessages(inputs);
    let prompt = messages.reduce((acc, message) => {
      const content = typeof message.content === 'string' ? message.content : message.content.map((c) => c.text ?? '').join('');
      if (message.role === 'user') {
        return `${acc}\n\nHuman: ${content}`;
      } else if (message.role === 'assistant') {
        return `${acc}\n\nAssistant: ${content}`;
      }
      return acc;
    }, '');
    prompt += '\n\nAssistant:';
    
    // Get the "System" prompt input for Claude 3 models
    const system = data.model.startsWith('claude-3') ? getSystemPrompt(inputs) : undefined;
    
    let { maxTokens } = data;
    const tokenizerInfo: TokenizerCallInfo = {
      node: context.node,
      model,
      endpoint: undefined,
    };
    const tokenCountEstimate = context.tokenizer.getTokenCountForString(prompt, tokenizerInfo);
    const modelInfo = anthropicModels[model] ?? {
      maxTokens: Number.MAX_SAFE_INTEGER,
      cost: {
        prompt: 0,
        completion: 0,
      },
    };
    if (tokenCountEstimate >= modelInfo.maxTokens) {
      throw new Error(
        `The model ${model} can only handle ${modelInfo.maxTokens} tokens, but ${tokenCountEstimate} were provided in the prompts alone.`,
      );
    }
    if (tokenCountEstimate + maxTokens > modelInfo.maxTokens) {
      const message = `The model can only handle a maximum of ${
        modelInfo.maxTokens
      } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
        modelInfo.maxTokens - tokenCountEstimate
      }.`;
      addWarning(output, message);
      maxTokens = Math.floor((modelInfo.maxTokens - tokenCountEstimate) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
    }
    try {
      return await retry(
        async () => {
          const completionOptions: Omit<ChatCompletionOptions, 'apiKey' | 'signal'> = {
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens_to_sample: maxTokens ?? modelInfo.maxTokens,
            stop_sequences: stop ? [stop] : undefined,
            prompt,
          };
          const messageOptions: Omit<ChatMessageOptions, 'apiKey' | 'signal'> = {
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_tokens: maxTokens ?? modelInfo.maxTokens,
            stop_sequences: stop ? [stop] : undefined,
            system: system,
            messages,
          };
          const useMessageApi = model.startsWith('claude-3');
          const cacheKey = JSON.stringify(useMessageApi ? messageOptions : completionOptions);
          if (data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }
          
          const startTime = Date.now();
          const apiKey = context.getPluginConfig('anthropicApiKey');
          
          if (useMessageApi) {
            // Use the messages API for Claude 3 models
            const chunks = streamMessageApi({
              apiKey: apiKey ?? '',
              signal: context.signal,
              ...messageOptions,
            });
          
            // Process the response chunks and update the output
            const responseParts: string[] = [];
            let requestTokens: number | undefined = undefined, responseTokens: number | undefined = undefined;
            for await (const chunk of chunks) {
              let completion: string = '';
              if (chunk.type === 'content_block_start') {
                completion = chunk.content_block.text;
              } else if (chunk.type === 'content_block_delta') {
                completion = chunk.delta.text; 
              } else if (chunk.type === 'message_start' && chunk.message?.usage?.input_tokens) {
                requestTokens = chunk.message.usage.input_tokens;
              } else if (chunk.type === 'message_delta' && chunk.delta?.usage?.output_tokens) {
                responseTokens = chunk.delta.usage.output_tokens;
              }
              if (!completion) {
                continue;
              }
              responseParts.push(completion);
              output['response' as PortId] = {
                type: 'string',
                value: responseParts.join('').trim(),
              };
              context.onPartialOutputs?.(output);
            }

            if (responseParts.length === 0) {
              throw new Error('No response from Anthropic');
            }
          
            output['requestTokens' as PortId] = { type: 'number', value: requestTokens ?? tokenCountEstimate };
            const responseTokenCount = responseTokens ?? context.tokenizer.getTokenCountForString(responseParts.join(''), tokenizerInfo);
            output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };
          } else {
            // Use the normal chat completion method for non-Claude 3 models
            const chunks = streamChatCompletions({
              apiKey: apiKey ?? '',
              signal: context.signal,
              ...completionOptions,
            });
          
            // Process the response chunks and update the output
            const responseParts: string[] = [];
            for await (const chunk of chunks) {
              if (!chunk.completion) {
                continue;
              }
              responseParts.push(chunk.completion);
              output['response' as PortId] = {
                type: 'string',
                value: responseParts.join('').trim(),
              };
              context.onPartialOutputs?.(output);
            }

            if (responseParts.length === 0) {
              throw new Error('No response from Anthropic');
            }
          
            output['requestTokens' as PortId] = { type: 'number', value: tokenCountEstimate };
            const responseTokenCount = context.tokenizer.getTokenCountForString(responseParts.join(''), tokenizerInfo);
            output['responseTokens' as PortId] = { type: 'number', value: responseTokenCount };
          }

          const cost = getCostForTokens({
            requestTokens: output['requestTokens' as PortId]?.value as number,
            responseTokens: output['responseTokens' as PortId]?.value as number,
          }, model);
          if (cost != null) {
            output['cost' as PortId] = { type: 'number', value: cost };
          }

          const endTime = Date.now();
          
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

            if (err instanceof AnthropicError) {
              if (err.response.status >= 400 && err.response.status < 500) {
                if ((err.responseJson as any).error?.message) {
                  throw new Error((err.responseJson as any).error.message);
                }
              }
            }
          },
        },
      );
    } catch (error) {
      context.trace(getError(error).stack ?? 'Missing stack');
      throw new Error(`Error processing ChatAnthropicNode: ${(error as Error).message}`);
    }
  },
};

export const chatAnthropicNode = pluginNodeDefinition(ChatAnthropicNodeImpl, 'Chat');

export function getSystemPrompt(inputs: Inputs) {
  const system = coerceTypeOptional(inputs['system' as PortId], 'string');
  if (system) {
    return system;
  }
  const prompt = inputs['prompt' as PortId];
  if (prompt && prompt.type === 'chat-message[]') {
    const systemMessage = prompt.value.find((message) => message.type === 'system');
    if (systemMessage) {
      if (typeof systemMessage.message === 'string') {
        return systemMessage.message;
      } else if (Array.isArray(systemMessage.message)) {
        return systemMessage.message.filter((p) => typeof p === 'string').join('');
      }
    }
  }
}

export async function getChatAnthropicNodeMessages(inputs: Inputs) {
  const prompt = inputs['prompt' as PortId];
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const chatMessages = match(prompt)
    .with({ type: 'chat-message' }, (p) => [p.value])
    .with({ type: 'chat-message[]' }, (p) => p.value)
    .with({ type: 'string' }, (p): ChatMessage[] => [{ type: 'user', message: p.value }])
    .with({ type: 'string[]' }, (p): ChatMessage[] => p.value.map((v) => ({ type: 'user', message: v })))
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

        return stringValues.filter((v) => v != null).map((v) => ({ type: 'user', message: v }));
      }

      const coercedMessage = coerceType(p, 'chat-message');
      if (coercedMessage != null) {
        return [coercedMessage];
      }

      const coercedString = coerceType(p, 'string');
      return coercedString != null ? [{ type: 'user', message: coerceType(p, 'string') }] : [];
    });


  const messages: Claude3ChatMessage[] = (await Promise.all(chatMessages.map(chatMessageToClaude3ChatMessage))).filter(isNotNull);

  return { messages };
}

async function chatMessageToClaude3ChatMessage(message: ChatMessage): Promise<Claude3ChatMessage | undefined> {
  if (message.type === 'system') {
    return undefined;
  }
  if (message.type === 'function') {
    throw new Error('Function messages are not supported by Claude');
  }
  const content = Array.isArray(message.message) ? await Promise.all(message.message.map(chatMessageContentToClaude3ChatMessage)) : [await chatMessageContentToClaude3ChatMessage(message.message)];
  return {
    role: message.type,
    content,
  };
}

async function chatMessageContentToClaude3ChatMessage(content: ChatMessageMessagePart): Promise<Claude3ChatMessageContentPart> {
  if (typeof content === 'string') {
    return {
      type: 'text',
      text: content,
    };
  }
  switch (content.type) {
    case 'image':
      return {
        type: 'image',
        source: {
          type: 'base64' as const,
          media_type: content.mediaType as string,
          data: (await uint8ArrayToBase64(content.data)) ?? '',
        },
      };
    case 'url':
      throw new Error('unable to convert urls for Claude');
    default:
      assertNever(content);
  }
}
function getCostForTokens(tokenCounts: { requestTokens: number; responseTokens: number; }, model: AnthropicModels): number | undefined {
  const modelInfo = anthropicModels[model];
  if (modelInfo == null) {
    return undefined;
  }
  return modelInfo.cost.prompt * tokenCounts.requestTokens + modelInfo.cost.completion * tokenCounts.responseTokens;
}

