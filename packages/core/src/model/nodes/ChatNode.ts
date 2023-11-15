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
  OpenAIError,
  openAiModelOptions,
  openaiModels,
  streamChatCompletions,
  type ChatCompletionTool,
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
import { chatMessageToOpenAIChatCompletionMessage } from '../../utils/chatMessageToOpenAIChatCompletionMessage.js';

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
  seed?: number;
  toolChoice?: 'none' | 'auto' | 'function';
  toolChoiceFunction?: string;
  responseFormat?: 'text' | 'json';
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
  useSeedInput?: boolean;
  useToolChoiceInput?: boolean;
  useToolChoiceFunctionInput?: boolean;
  useResponseFormatInput?: boolean;

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
        description:
          'The endpoint to use for the OpenAI API. You can use this to replace with any OpenAI-compatible API. Leave blank for the default: https://api.openai.com/api/v1/chat/completions',
      });
    }

    inputs.push({
      id: 'systemPrompt' as PortId,
      title: 'System Prompt',
      dataType: 'string',
      required: false,
      description: 'The system prompt to send to the model.',
      coerced: true,
    });

    if (this.data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
        description: 'The model to use for the chat.',
      });
    }

    if (this.data.useTemperatureInput) {
      inputs.push({
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
        description:
          'What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
      });
    }

    if (this.data.useTopPInput) {
      inputs.push({
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
        description:
          'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      });
    }

    if (this.data.useUseTopPInput) {
      inputs.push({
        dataType: 'boolean',
        id: 'useTopP' as PortId,
        title: 'Use Top P',
        description: 'Whether to use top p sampling, or temperature sampling.',
      });
    }

    if (this.data.useMaxTokensInput) {
      inputs.push({
        dataType: 'number',
        id: 'maxTokens' as PortId,
        title: 'Max Tokens',
        description: 'The maximum number of tokens to generate in the chat completion.',
      });
    }

    if (this.data.useStopInput) {
      inputs.push({
        dataType: 'string',
        id: 'stop' as PortId,
        title: 'Stop',
        description: 'A sequence where the API will stop generating further tokens.',
      });
    }

    if (this.data.usePresencePenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'presencePenalty' as PortId,
        title: 'Presence Penalty',
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.`,
      });
    }

    if (this.data.useFrequencyPenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'frequencyPenalty' as PortId,
        title: 'Frequency Penalty',
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
      });
    }

    if (this.data.useUserInput) {
      inputs.push({
        dataType: 'string',
        id: 'user' as PortId,
        title: 'User',
        description:
          'A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.',
      });
    }

    if (this.data.useNumberOfChoicesInput) {
      inputs.push({
        dataType: 'number',
        id: 'numberOfChoices' as PortId,
        title: 'Number of Choices',
        description: 'If greater than 1, the model will return multiple choices and the response will be an array.',
      });
    }

    if (this.data.useHeadersInput) {
      inputs.push({
        dataType: 'object',
        id: 'headers' as PortId,
        title: 'Headers',
        description: 'Additional headers to send to the API.',
      });
    }

    inputs.push({
      dataType: ['chat-message', 'chat-message[]'] as const,
      id: 'prompt' as PortId,
      title: 'Prompt',
      description: 'The prompt message or messages to send to the model.',
      coerced: true,
    });

    if (this.data.enableFunctionUse) {
      inputs.push({
        dataType: ['gpt-function', 'gpt-function[]'] as const,
        id: 'functions' as PortId,
        title: 'Functions',
        description: 'Functions to use in the model. To connect multiple functions, use an Array node.',
        coerced: false,
      });
    }

    if (this.data.useSeedInput) {
      inputs.push({
        dataType: 'number',
        id: 'seed' as PortId,
        title: 'Seed',
        coerced: true,
        description:
          'If specified, OpenAI will make a best effort to sample deterministically, such that repeated requests with the same `seed` and parameters should return the same result.',
      });
    }

    if (this.data.useToolChoiceInput) {
      inputs.push({
        dataType: 'string',
        id: 'toolChoice' as PortId,
        title: 'Tool Choice',
        coerced: true,
        description:
          'Controls which (if any) function is called by the model. `none` is the default when no functions are present. `auto` is the default if functions are present. `function` forces the model to call a function.',
      });
    }

    if (this.data.useToolChoiceInput || this.data.useToolChoiceFunctionInput) {
      inputs.push({
        dataType: 'string',
        id: 'toolChoiceFunction' as PortId,
        title: 'Tool Choice Function',
        coerced: true,
        description: 'The name of the function to force the model to call.',
      });
    }

    if (this.data.useResponseFormatInput) {
      inputs.push({
        dataType: 'string',
        id: 'responseFormat' as PortId,
        title: 'Response Format',
        coerced: true,
        description: 'The format to force the model to reply in.',
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
        description: 'All responses from the model.',
      });
    } else {
      outputs.push({
        dataType: 'string',
        id: 'response' as PortId,
        title: 'Response',
        description: 'The textual response from the model.',
      });
    }

    if (this.data.enableFunctionUse) {
      outputs.push({
        dataType: 'object',
        id: 'function-call' as PortId,
        title: 'Function Call',
        description: 'The function call that was made, if any.',
      });
    }

    outputs.push({
      dataType: 'chat-message[]',
      id: 'in-messages' as PortId,
      title: 'Messages Sent',
      description: 'All messages sent to the model.',
    });

    if (!(this.data.useNumberOfChoicesInput || (this.data.numberOfChoices ?? 1) > 1)) {
      outputs.push({
        dataType: 'chat-message[]',
        id: 'all-messages' as PortId,
        title: 'All Messages',
        description: 'All messages, with the response appended.',
      });
    }

    outputs.push({
      dataType: 'number',
      id: 'responseTokens' as PortId,
      title: 'Response Tokens',
      description: 'The number of tokens in the response from the LLM. For a multi-response, this is the sum.',
    });

    return outputs;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes a call to an LLM chat model. Supports GPT and any OpenAI-compatible API. The settings contains many options for tweaking the model's behavior.

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
          if (data.model === 'local-model') {
            return 'Local model is an indicator for your own convenience, it does not affect the local LLM used.';
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
            helperMessage:
              'What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
          },
          {
            type: 'number',
            label: 'Top P',
            dataKey: 'top_p',
            useInputToggleDataKey: 'useTopPInput',
            min: 0,
            max: 1,
            step: 0.1,
            helperMessage:
              'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
          },
          {
            type: 'toggle',
            label: 'Use Top P',
            dataKey: 'useTopP',
            useInputToggleDataKey: 'useUseTopPInput',
            helperMessage: 'Whether to use top p sampling, or temperature sampling.',
          },
          {
            type: 'number',
            label: 'Max Tokens',
            dataKey: 'maxTokens',
            useInputToggleDataKey: 'useMaxTokensInput',
            min: 0,
            max: Number.MAX_SAFE_INTEGER,
            step: 1,
            helperMessage: 'The maximum number of tokens to generate in the chat completion.',
          },
          {
            type: 'string',
            label: 'Stop',
            dataKey: 'stop',
            useInputToggleDataKey: 'useStopInput',
            helperMessage: 'A sequence where the API will stop generating further tokens.',
          },
          {
            type: 'number',
            label: 'Presence Penalty',
            dataKey: 'presencePenalty',
            useInputToggleDataKey: 'usePresencePenaltyInput',
            min: 0,
            max: 2,
            step: 0.1,
            helperMessage: `Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.`,
          },
          {
            type: 'number',
            label: 'Frequency Penalty',
            dataKey: 'frequencyPenalty',
            useInputToggleDataKey: 'useFrequencyPenaltyInput',
            min: 0,
            max: 2,
            step: 0.1,
            helperMessage: `Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
          },
          {
            type: 'dropdown',
            label: 'Response Format',
            dataKey: 'responseFormat',
            useInputToggleDataKey: 'useResponseFormatInput',
            options: [
              { value: '', label: 'Default' },
              { value: 'text', label: 'Text' },
              { value: 'json', label: 'JSON Object' },
            ],
            defaultValue: '',
            helperMessage: 'The format to force the model to reply in.',
          },
          {
            type: 'number',
            label: 'Seed',
            dataKey: 'seed',
            useInputToggleDataKey: 'useSeedInput',
            step: 1,
            allowEmpty: true,
            helperMessage:
              'If specified, OpenAI will make a best effort to sample deterministically, such that repeated requests with the same `seed` and parameters should return the same result.',
          },
        ],
      },
      {
        type: 'group',
        label: 'GPT Tools',
        editors: [
          {
            type: 'toggle',
            label: 'Enable Function Use',
            dataKey: 'enableFunctionUse',
          },
          {
            type: 'dropdown',
            label: 'Tool Choice',
            dataKey: 'toolChoice',
            useInputToggleDataKey: 'useToolChoiceInput',
            options: [
              { value: '', label: 'Default' },
              { value: 'none', label: 'None' },
              { value: 'auto', label: 'Auto' },
              { value: 'function', label: 'Function' },
            ],
            defaultValue: '',
            helperMessage:
              'Controls which (if any) function is called by the model. None is the default when no functions are present. Auto is the default if functions are present.',
            hideIf: (data) => !data.enableFunctionUse,
          },
          {
            type: 'string',
            label: 'Tool Choice Function',
            dataKey: 'toolChoiceFunction',
            useInputToggleDataKey: 'useToolChoiceFunctionInput',
            helperMessage: 'The name of the function to force the model to call.',
            hideIf: (data) => data.toolChoice !== 'function' || !data.enableFunctionUse,
          },
        ],
      },
      {
        type: 'group',
        label: 'Advanced',
        editors: [
          {
            type: 'string',
            label: 'User',
            dataKey: 'user',
            useInputToggleDataKey: 'useUserInput',
            helperMessage:
              'A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.',
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
            helperMessage:
              'If greater than 1, the model will return multiple choices and the response will be an array.',
          },
          {
            type: 'string',
            label: 'Endpoint',
            dataKey: 'endpoint',
            useInputToggleDataKey: 'useEndpointInput',
            helperMessage:
              'The endpoint to use for the OpenAI API. You can use this to replace with any OpenAI-compatible API. Leave blank for the default: https://api.openai.com/api/v1/chat/completions',
          },
          {
            type: 'string',
            label: 'Custom Model',
            dataKey: 'overrideModel',
            helperMessage: 'Overrides the model selected above with a custom string for the model.',
          },
          {
            type: 'number',
            label: 'Custom Max Tokens',
            dataKey: 'overrideMaxTokens',
            allowEmpty: true,
            helperMessage:
              'Overrides the max number of tokens a model can support. Leave blank for preconfigured token limits.',
          },
          {
            type: 'keyValuePair',
            label: 'Headers',
            dataKey: 'headers',
            useInputToggleDataKey: 'useHeadersInput',
            keyPlaceholder: 'Header',
            helperMessage: 'Additional headers to send to the API.',
          },
          {
            type: 'toggle',
            label: 'Cache In Rivet',
            dataKey: 'cache',
            helperMessage:
              'If on, requests with the same parameters and messages will be cached in Rivet, for immediate responses without an API call.',
          },
          {
            type: 'toggle',
            label: 'Use for subgraph partial output',
            dataKey: 'useAsGraphPartialOutput',
            helperMessage:
              'If on, streaming responses from this node will be shown in Subgraph nodes that call this graph.',
          },
        ],
      },
    ];
  }

  getBody() {
    return dedent`
      ${this.data.endpoint ? `${this.data.endpoint}` : ''}
      ${this.data.useMaxTokensInput ? 'Max Tokens: (Using Input)' : `${this.data.maxTokens} tokens`}
      Model: ${this.data.useModelInput ? '(Using Input)' : this.data.overrideModel || this.data.model}
      ${this.data.useTopP ? 'Top P' : 'Temperature'}:
      ${
        this.data.useTopP
          ? this.data.useTopPInput
            ? '(Using Input)'
            : this.data.top_p
          : this.data.useTemperatureInput
          ? '(Using Input)'
          : this.data.temperature
      }
      ${this.data.useStop ? `Stop: ${this.data.useStopInput ? '(Using Input)' : this.data.stop}` : ''}
      ${
        (this.data.frequencyPenalty ?? 0) !== 0
          ? `Frequency Penalty: ${this.data.useFrequencyPenaltyInput ? '(Using Input)' : this.data.frequencyPenalty}`
          : ''
      }
      ${
        (this.data.presencePenalty ?? 0) !== 0
          ? `Presence Penalty: ${this.data.usePresencePenaltyInput ? '(Using Input)' : this.data.presencePenalty}`
          : ''
      }
    `.trim();
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
    const seed = getInputOrData(this.data, inputs, 'seed', 'number');
    const responseFormat = getInputOrData(this.data, inputs, 'responseFormat') as 'text' | 'json' | '';
    const toolChoiceMode = getInputOrData(this.data, inputs, 'toolChoice', 'string') as 'none' | 'auto' | 'function';

    const toolChoice: ChatCompletionOptions['tool_choice'] = !toolChoiceMode
      ? undefined
      : toolChoiceMode === 'function'
      ? {
          type: 'function',
          function: {
            name: getInputOrData(this.data, inputs, 'toolChoiceFunction', 'string'),
          },
        }
      : toolChoiceMode;

    const openaiResponseFormat = !responseFormat?.trim()
      ? undefined
      : responseFormat === 'json'
      ? ({
          type: 'json_object',
        } as const)
      : ({
          type: 'text',
        } as const);

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

    const tools = (functions ?? []).map(
      (fn): ChatCompletionTool => ({
        function: fn,
        type: 'function',
      }),
    );

    const { messages } = getChatNodeMessages(inputs);

    const completionMessages = await Promise.all(
      messages.map((message) => chatMessageToOpenAIChatCompletionMessage(message)),
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
    const tokenCount = await context.tokenizer.getTokenCountForMessages(messages, functions, tokenizerInfo);

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
            tools: tools.length > 0 ? tools : undefined,
            endpoint: resolvedEndpointAndHeaders.endpoint,
            seed,
            response_format: openaiResponseFormat,
            tool_choice: toolChoice,
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

          // First array is the function calls per choice, inner array is the functions calls inside the choice
          const functionCalls: {
            type: 'function';
            id: string;
            name: string;
            arguments: string;
            lastParsedArguments?: unknown;
          }[][] = [];

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

              if (delta.tool_calls) {
                // Are we sure that tool_calls will always be full and not a bunch of deltas?
                functionCalls[index] ??= [];

                for (const toolCall of delta.tool_calls) {
                  functionCalls[index]![toolCall.index] ??= {
                    type: 'function',
                    arguments: '',
                    lastParsedArguments: undefined,
                    name: '',
                    id: '',
                  };

                  if (toolCall.id) {
                    functionCalls[index]![toolCall.index]!.id = toolCall.id;
                  }

                  if (toolCall.function.name) {
                    functionCalls[index]![toolCall.index]!.name += toolCall.function.name;
                  }

                  if (toolCall.function.arguments) {
                    functionCalls[index]![toolCall.index]!.arguments += toolCall.function.arguments;

                    try {
                      functionCalls[index]![toolCall.index]!.lastParsedArguments = JSON.parse(
                        functionCalls[index]![toolCall.index]!.arguments,
                      );
                    } catch (error) {
                      // Ignore
                    }
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
                  value: functionCalls.map((functionCalls) => ({
                    name: functionCalls[0]?.name,
                    arguments: functionCalls[0]?.lastParsedArguments,
                    id: functionCalls[0]?.id,
                  })),
                };
              } else {
                output['function-call' as PortId] = {
                  type: 'object',
                  value: {
                    name: functionCalls[0]![0]?.name,
                    arguments: functionCalls[0]![0]?.lastParsedArguments,
                    id: functionCalls[0]![0]?.id,
                  } as Record<string, unknown>,
                };
              }
            }

            context.onPartialOutputs?.(output);
          }

          if (!isMultiResponse) {
            output['all-messages' as PortId] = {
              type: 'chat-message[]',
              value: [
                ...messages,
                {
                  type: 'assistant',
                  message: responseChoicesParts[0]?.join('') ?? '',
                  function_call: functionCalls[0]
                    ? {
                        name: functionCalls[0][0]!.name,
                        arguments: functionCalls[0][0]!.arguments, // Needs the stringified one here in chat list
                        id: functionCalls[0][0]!.id,
                      }
                    : undefined,
                },
              ],
            };
          }

          const endTime = Date.now();

          if (responseChoicesParts.length === 0 && functionCalls.length === 0) {
            throw new Error('No response from OpenAI');
          }

          output['in-messages' as PortId] = { type: 'chat-message[]', value: messages };
          output['requestTokens' as PortId] = { type: 'number', value: tokenCount * (numberOfChoices ?? 1) };

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
    .with({ type: 'string' }, (p): ChatMessage[] => [{ type: 'user', message: p.value }])
    .with({ type: 'string[]' }, (p): ChatMessage[] => p.value.map((v) => ({ type: 'user', message: v })))
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

        return stringValues.filter((v) => v != null).map((v) => ({ type: 'user', message: v }));
      }

      const coercedMessage = coerceTypeOptional(p, 'chat-message');
      if (coercedMessage != null) {
        return [coercedMessage];
      }

      const coercedString = coerceTypeOptional(p, 'string');
      return coercedString != null ? [{ type: 'user', message: coerceType(p, 'string') }] : [];
    });

  const systemPrompt = inputs['systemPrompt' as PortId];
  if (systemPrompt) {
    messages = [{ type: 'system', message: coerceType(systemPrompt, 'string') }, ...messages];
  }

  return { messages, systemPrompt };
}

export function getCostForTokens(tokenCount: number, type: 'prompt' | 'completion', costPerThousand: number) {
  return (tokenCount / 1000) * costPerThousand;
}
