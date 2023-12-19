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
} from '../../../index.js';
import {
  type GoogleModels,
  type ChatCompletionOptions,
  googleModelOptions,
  googleModels,
  streamChatCompletions,
  type GoogleChatMessage,
} from '../google.js';
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

export type ChatGoogleNode = ChartNode<'chatGoogle', ChatGoogleNodeData>;

export type ChatGoogleNodeConfigData = {
  model: GoogleModels;
  temperature: number;
  useTopP: boolean;
  top_p?: number;
  top_k?: number;
  maxTokens: number;
};

export type ChatGoogleNodeData = ChatGoogleNodeConfigData & {
  useModelInput: boolean;
  useTemperatureInput: boolean;
  useTopPInput: boolean;
  useTopKInput: boolean;
  useUseTopPInput: boolean;
  useMaxTokensInput: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;

  useAsGraphPartialOutput?: boolean;
};

// Temporary
const cache = new Map<string, Outputs>();

export const ChatGoogleNodeImpl: PluginNodeImpl<ChatGoogleNode> = {
  create(): ChatGoogleNode {
    const chartNode: ChatGoogleNode = {
      type: 'chatGoogle',
      title: 'Chat (Google)',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 275,
      },
      data: {
        model: 'gemini-pro',
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

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
    });

    return inputs;
  },

  getOutputDefinitions(data): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      dataType: 'string',
      id: 'response' as PortId,
      title: 'Response',
    });

    outputs.push({
      dataType: 'chat-message[]',
      id: 'in-messages' as PortId,
      title: 'Messages Sent',
      description: 'All messages sent to the model.',
    });

    outputs.push({
      dataType: 'chat-message[]',
      id: 'all-messages' as PortId,
      title: 'All Messages',
      description: 'All messages, with the response appended.',
    });

    return outputs;
  },

  getBody(data): string {
    return dedent`
      ${googleModels[data.model]?.displayName ?? `Google (${data.model})`}
      ${
        data.useTopP
          ? `Top P: ${data.useTopPInput ? '(Using Input)' : data.top_p}`
          : `Temperature: ${data.useTemperatureInput ? '(Using Input)' : data.temperature}`
      }
      Max Tokens: ${data.maxTokens}
    `;
  },

  getEditors(): EditorDefinition<ChatGoogleNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        options: googleModelOptions,
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
        Makes a call to an Google chat model. The settings contains many options for tweaking the model's behavior.
      `,
      infoBoxTitle: 'Chat (Google) Node',
      contextMenuTitle: 'Chat (Google)',
      group: ['AI'],
    };
  },

  async process(data, inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    const rawModel = data.useModelInput
      ? coerceTypeOptional(inputs['model' as PortId], 'string') ?? data.model
      : data.model;

    const model = rawModel as GoogleModels;

    const temperature = data.useTemperatureInput
      ? coerceTypeOptional(inputs['temperature' as PortId], 'number') ?? data.temperature
      : data.temperature;

    const topP = data.useTopPInput ? coerceTypeOptional(inputs['top_p' as PortId], 'number') ?? data.top_p : data.top_p;

    const useTopP = data.useUseTopPInput
      ? coerceTypeOptional(inputs['useTopP' as PortId], 'boolean') ?? data.useTopP
      : data.useTopP;

    const { messages } = getChatGoogleNodeMessages(inputs);

    const prompt = await Promise.all(messages.map(async (message): Promise<GoogleChatMessage> => {
      return {
        role: message.type === 'user' ? 'user' : 'assistant',
        parts: await Promise.all([message.message].flat().map(async (part): Promise<GoogleChatMessage['parts'][0]> => {
          if (typeof part === 'string') {
            return { text: part };
          } else if (part.type === 'image') {
            return {
              inline_data: {
                mime_type: part.mediaType,
                data: (await uint8ArrayToBase64(part.data))!,
              }
            };
          } else {
            throw new Error(`Google Vertex AI does not support message parts of type ${part.type}`);
          }
        })),
      };
    }));

    let { maxTokens } = data;

    const tokenizerInfo: TokenizerCallInfo = {
      node: context.node,
      model,
      endpoint: undefined,
    };

    // TODO Better token counting for Google models.
    const tokenCount = await context.tokenizer.getTokenCountForMessages(messages, undefined, tokenizerInfo);

    if (googleModels[model] && tokenCount >= googleModels[model].maxTokens) {
      throw new Error(
        `The model ${model} can only handle ${googleModels[model].maxTokens} tokens, but ${tokenCount} were provided in the prompts alone.`,
      );
    }

    if (googleModels[model] && tokenCount + maxTokens > googleModels[model].maxTokens) {
      const message = `The model can only handle a maximum of ${
        googleModels[model].maxTokens
      } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
        googleModels[model].maxTokens - tokenCount
      }.`;
      addWarning(output, message);
      maxTokens = Math.floor((googleModels[model].maxTokens - tokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
    }

    const project = context.getPluginConfig('googleProjectId');
    const location = context.getPluginConfig('googleRegion');
    const applicationCredentials = context.getPluginConfig('googleApplicationCredentials');

    if (project == null) {
      throw new Error('Google Project ID is not defined.');
    }
    if (location == null) {
      throw new Error('Google Region is not defined.');
    }
    if (applicationCredentials == null) {
      throw new Error('Google Application Credentials is not defined.');
    }

    try {
      return await retry(
        async () => {
          const options: Omit<ChatCompletionOptions, 'project' | 'location' | 'applicationCredentials' | 'signal'> = {
            prompt,
            model,
            temperature: useTopP ? undefined : temperature,
            top_p: useTopP ? topP : undefined,
            max_output_tokens: maxTokens,
          };
          const cacheKey = JSON.stringify(options);

          if (data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }

          const startTime = Date.now();

          const chunks = streamChatCompletions({
            signal: context.signal,
            project,
            location,
            applicationCredentials,
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

          output['all-messages' as PortId] = {
            type: 'chat-message[]',
            value: [
              ...messages,
              {
                type: 'assistant',
                message: responseParts.join('').trim() ?? '',
                function_call: undefined,
              },
            ],
          };

          output['in-messages' as PortId] = {
            type: 'chat-message[]',
            value: messages,
          };

          if (responseParts.length === 0) {
            throw new Error('No response from Google');
          }

          output['requestTokens' as PortId] = { type: 'number', value: tokenCount };

          const responseTokenCount = context.tokenizer.getTokenCountForString(responseParts.join(''), tokenizerInfo);
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
          retries: 10,
          maxRetryTime: 1000 * 60 * 5,
          factor: 2.5,
          minTimeout: 500,
          maxTimeout: 5000,
          randomize: true,
          signal: context.signal,
          onFailedAttempt(err) {
            context.trace(`ChatGoogleNode failed, retrying: ${err.toString()}`);

            if (context.signal.aborted) {
              throw new Error('Aborted');
            }
          },
        },
      );
    } catch (error) {
      context.trace(getError(error).stack ?? 'Missing stack');
      throw new Error(`Error processing ChatGoogleNode: ${(error as Error).message}`);
    }
  },
};

export const chatGoogleNode = pluginNodeDefinition(ChatGoogleNodeImpl, 'Chat');

export function getChatGoogleNodeMessages(inputs: Inputs) {
  const prompt = inputs['prompt' as PortId];
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const messages: ChatMessage[] = match(prompt)
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
  return { messages };
}
