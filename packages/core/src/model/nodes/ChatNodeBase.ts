import { match } from 'ts-pattern';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';
import { getError } from '../../utils/errors.js';
import { dedent } from '../../utils/misc.js';
import {
  OpenAIError,
  openAiModelOptions,
  openaiModels,
  type ChatCompletionOptions,
  type ChatCompletionTool,
  chatCompletions,
  streamChatCompletions,
  type ChatCompletionChunkUsage,
  defaultOpenaiSupported,
  type OpenAIModel,
} from '../../utils/openai.js';
import { isArrayDataValue, type ChatMessage, getScalarTypeOf, type ScalarDataValue } from '../DataValue.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { ChartNode, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import type { ChatNode } from './ChatNode.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { cleanHeaders, getInputOrData } from '../../utils/inputs.js';
import type { InternalProcessContext } from '../ProcessContext.js';
import { chatMessageToOpenAIChatCompletionMessage } from '../../utils/chatMessageToOpenAIChatCompletionMessage.js';
import { DEFAULT_CHAT_ENDPOINT } from '../../utils/defaults.js';
import type { TokenizerCallInfo } from '../../integrations/Tokenizer.js';
import { addWarning } from '../../utils/outputs.js';
import retry from 'p-retry';
import { base64ToUint8Array } from '../../utils/base64.js';

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
  responseFormat?: '' | 'text' | 'json' | 'json_schema';
  parallelFunctionCalling?: boolean;
  additionalParameters?: { key: string; value: string }[];
  responseSchemaName?: string;
  useServerTokenCalculation?: boolean;
  outputUsage?: boolean;
  usePredictedOutput?: boolean;
  reasoningEffort?: '' | 'low' | 'medium' | 'high';

  modalitiesIncludeText?: boolean;
  modalitiesIncludeAudio?: boolean;

  audioVoice?: string;
  audioFormat?: 'wav' | 'mp3' | 'flac' | 'opus' | 'pcm16';
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
  useAdditionalParametersInput?: boolean;
  useResponseSchemaNameInput?: boolean;
  useAudioVoiceInput?: boolean;
  useAudioFormatInput?: boolean;
  useReasoningEffortInput?: boolean;

  /** Given the same set of inputs, return the same output without hitting GPT */
  cache: boolean;

  useAsGraphPartialOutput?: boolean;
};

// Temporary
const cache = new Map<string, Outputs>();

export const ChatNodeBase = {
  defaultData: (): ChatNodeData => ({
    model: 'gpt-4o-mini',
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
    presencePenalty: undefined,
    usePresencePenaltyInput: false,
    frequencyPenalty: undefined,
    useFrequencyPenaltyInput: false,
    user: undefined,
    useUserInput: false,
    enableFunctionUse: false,
    cache: false,
    useAsGraphPartialOutput: true,
    parallelFunctionCalling: true,
    additionalParameters: [],
    useAdditionalParametersInput: false,
    useServerTokenCalculation: true,
    outputUsage: false,
    usePredictedOutput: false,
    modalitiesIncludeAudio: false,
    modalitiesIncludeText: false,
    reasoningEffort: '',
    useReasoningEffortInput: false,
  }),

  getInputDefinitions: (data: ChatNodeData): NodeInputDefinition[] => {
    const inputs: NodeInputDefinition[] = [];

    if (data.useEndpointInput) {
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

    if (data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        title: 'Model',
        dataType: 'string',
        required: false,
        description: 'The model to use for the chat.',
      });
    }

    if (data.useTemperatureInput) {
      inputs.push({
        dataType: 'number',
        id: 'temperature' as PortId,
        title: 'Temperature',
        description:
          'What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
      });
    }

    if (data.useTopPInput) {
      inputs.push({
        dataType: 'number',
        id: 'top_p' as PortId,
        title: 'Top P',
        description:
          'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      });
    }

    if (data.useUseTopPInput) {
      inputs.push({
        dataType: 'boolean',
        id: 'useTopP' as PortId,
        title: 'Use Top P',
        description: 'Whether to use top p sampling, or temperature sampling.',
      });
    }

    if (data.useMaxTokensInput) {
      inputs.push({
        dataType: 'number',
        id: 'maxTokens' as PortId,
        title: 'Max Tokens',
        description: 'The maximum number of tokens to generate in the chat completion.',
      });
    }

    if (data.useStopInput) {
      inputs.push({
        dataType: 'string',
        id: 'stop' as PortId,
        title: 'Stop',
        description: 'A sequence where the API will stop generating further tokens.',
      });
    }

    if (data.usePresencePenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'presencePenalty' as PortId,
        title: 'Presence Penalty',
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.`,
      });
    }

    if (data.useFrequencyPenaltyInput) {
      inputs.push({
        dataType: 'number',
        id: 'frequencyPenalty' as PortId,
        title: 'Frequency Penalty',
        description: `Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
      });
    }

    if (data.useUserInput) {
      inputs.push({
        dataType: 'string',
        id: 'user' as PortId,
        title: 'User',
        description:
          'A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse.',
      });
    }

    if (data.useNumberOfChoicesInput) {
      inputs.push({
        dataType: 'number',
        id: 'numberOfChoices' as PortId,
        title: 'Number of Choices',
        description: 'If greater than 1, the model will return multiple choices and the response will be an array.',
      });
    }

    if (data.useHeadersInput) {
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

    if (data.enableFunctionUse) {
      inputs.push({
        dataType: ['gpt-function', 'gpt-function[]'] as const,
        id: 'functions' as PortId,
        title: 'Functions',
        description: 'Functions to use in the model. To connect multiple functions, use an Array node.',
        coerced: false,
      });
    }

    if (data.useSeedInput) {
      inputs.push({
        dataType: 'number',
        id: 'seed' as PortId,
        title: 'Seed',
        coerced: true,
        description:
          'If specified, OpenAI will make a best effort to sample deterministically, such that repeated requests with the same `seed` and parameters should return the same result.',
      });
    }

    if (data.useToolChoiceInput) {
      inputs.push({
        dataType: 'string',
        id: 'toolChoice' as PortId,
        title: 'Tool Choice',
        coerced: true,
        description:
          'Controls which (if any) function is called by the model. `none` is the default when no functions are present. `auto` is the default if functions are present. `function` forces the model to call a function.',
      });
    }

    if (data.useToolChoiceInput || data.useToolChoiceFunctionInput) {
      inputs.push({
        dataType: 'string',
        id: 'toolChoiceFunction' as PortId,
        title: 'Tool Choice Function',
        coerced: true,
        description: 'The name of the function to force the model to call.',
      });
    }

    if (data.useResponseFormatInput) {
      inputs.push({
        dataType: 'string',
        id: 'responseFormat' as PortId,
        title: 'Response Format',
        coerced: true,
        description: 'The format to force the model to reply in.',
      });
    }

    if (data.useAdditionalParametersInput) {
      inputs.push({
        dataType: 'object',
        id: 'additionalParameters' as PortId,
        title: 'Additional Parameters',
        description: 'Additional chat completion parameters to send to the API.',
      });
    }

    if (data.responseFormat === 'json_schema') {
      inputs.push({
        dataType: 'object',
        id: 'responseSchema' as PortId,
        title: 'Response Schema',
        description: 'The JSON schema that the response will adhere to (Structured Outputs).',
        required: true,
      });

      if (data.useResponseSchemaNameInput) {
        inputs.push({
          dataType: 'string',
          id: 'responseSchemaName' as PortId,
          title: 'Response Schema Name',
          description: 'The name of the JSON schema that the response will adhere to (Structured Outputs).',
          required: false,
        });
      }
    }

    if (data.usePredictedOutput) {
      inputs.push({
        dataType: 'string[]',
        id: 'predictedOutput' as PortId,
        title: 'Predicted Output',
        description: 'The predicted output from the model.',
        coerced: true,
      });
    }

    if (data.useAudioVoiceInput) {
      inputs.push({
        dataType: 'string',
        id: 'audioVoice' as PortId,
        title: 'Audio Voice',
        description: 'The voice to use for audio responses. See your model for supported voices.',
      });
    }

    if (data.useAudioFormatInput) {
      inputs.push({
        dataType: 'string',
        id: 'audioFormat' as PortId,
        title: 'Audio Format',
        description: 'The format to use for audio responses.',
      });
    }

    return inputs;
  },

  getOutputDefinitions: (data: ChatNodeData): NodeInputDefinition[] => {
    const outputs: NodeOutputDefinition[] = [];

    if (data.useNumberOfChoicesInput || (data.numberOfChoices ?? 1) > 1) {
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

    if (data.enableFunctionUse) {
      if (data.parallelFunctionCalling) {
        outputs.push({
          dataType: 'object[]',
          id: 'function-calls' as PortId,
          title: 'Function Calls',
          description: 'The function calls that were made, if any.',
        });
      } else {
        outputs.push({
          dataType: 'object',
          id: 'function-call' as PortId,
          title: 'Function Call',
          description: 'The function call that was made, if any.',
        });
      }
    }

    outputs.push({
      dataType: 'chat-message[]',
      id: 'in-messages' as PortId,
      title: 'Messages Sent',
      description: 'All messages sent to the model.',
    });

    if (!(data.useNumberOfChoicesInput || (data.numberOfChoices ?? 1) > 1)) {
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

    if (data.outputUsage) {
      outputs.push({
        dataType: 'object',
        id: 'usage' as PortId,
        title: 'Usage',
        description: 'Usage statistics for the model.',
      });
    }

    if (data.modalitiesIncludeAudio) {
      outputs.push({
        dataType: 'audio',
        id: 'audio' as PortId,
        title: 'Audio',
        description: 'The audio response from the model.',
      });

      outputs.push({
        dataType: 'string',
        id: 'audioTranscript' as PortId,
        title: 'Transcript',
        description: 'The transcript of the audio response.',
      });
    }

    return outputs;
  },

  getEditors: (): EditorDefinition<ChatNode>[] => {
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
            allowEmpty: true,
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
            allowEmpty: true,
            helperMessage: `Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.`,
          },
          {
            type: 'dropdown',
            label: 'Reasoning Effort',
            dataKey: 'reasoningEffort',
            useInputToggleDataKey: 'useReasoningEffortInput',
            options: [
              { value: '', label: 'Unset' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ],
            defaultValue: '',
            helperMessage:
              'Adjust the level of reasoning depth the model should apply. Only applies to reasoning models such as o3-mini.',
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
              { value: 'json_schema', label: 'JSON Schema' },
            ],
            defaultValue: '',
            helperMessage: 'The format to force the model to reply in.',
          },
          {
            type: 'string',
            label: 'Response Schema Name',
            dataKey: 'responseSchemaName',
            useInputToggleDataKey: 'useResponseSchemaNameInput',
            helperMessage:
              'The name of the JSON schema that the response will adhere to (Structured Outputs). Defaults to response_schema',
            hideIf: (data) => data.responseFormat !== 'json_schema',
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
            type: 'toggle',
            label: 'Enable Parallel Function Calling',
            dataKey: 'parallelFunctionCalling',
            hideIf: (data) => !data.enableFunctionUse,
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
              { value: 'required', label: 'Required' },
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
        label: 'Features',
        editors: [
          {
            type: 'toggle',
            label: 'Enable Predicted Output',
            dataKey: 'usePredictedOutput',
            helperMessage:
              'If on, enables an input port for the predicted output from the model, when many of the output tokens are known ahead of time.',
          },
          {
            type: 'toggle',
            label: 'Modalities: Text',
            dataKey: 'modalitiesIncludeText',
            helperMessage: 'If on, the model will include text in its responses. Only relevant for multimodal models.',
          },
          {
            type: 'toggle',
            label: 'Modalities: Audio',
            dataKey: 'modalitiesIncludeAudio',
            helperMessage: 'If on, the model will include audio in its responses. Only relevant for multimodal models.',
          },
          {
            type: 'string',
            label: 'Audio Voice',
            dataKey: 'audioVoice',
            useInputToggleDataKey: 'useAudioVoiceInput',
            helperMessage:
              'The voice to use for audio responses. See your model for supported voices. OpenAI voices are: alloy, ash, coral, echo, fable, onyx, nova, sage, and shimmer.',
            hideIf: (data) => !data.modalitiesIncludeAudio,
          },
          {
            type: 'dropdown',
            label: 'Audio Format',
            dataKey: 'audioFormat',
            useInputToggleDataKey: 'useAudioFormatInput',
            options: [
              { value: 'wav', label: 'WAV' },
              { value: 'mp3', label: 'MP3' },
              { value: 'flac', label: 'FLAC' },
              { value: 'opus', label: 'OPUS' },
              { value: 'pcm16', label: 'PCM16' },
            ],
            defaultValue: 'wav',
            hideIf: (data) => !data.modalitiesIncludeAudio,
          },
        ],
      },
      {
        type: 'group',
        label: 'Advanced',
        editors: [
          {
            type: 'toggle',
            label: 'Use Server Token Calculation',
            dataKey: 'useServerTokenCalculation',
            helperMessage:
              'If on, do not calculate token counts on the client side, and rely on the server providing the token count.',
          },
          {
            type: 'toggle',
            label: 'Output Usage Statistics',
            dataKey: 'outputUsage',
            helperMessage: 'If on, output usage statistics for the model, such as token counts and cost.',
          },
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
          {
            type: 'keyValuePair',
            label: 'Additional Parameters',
            dataKey: 'additionalParameters',
            useInputToggleDataKey: 'useAdditionalParametersInput',
            keyPlaceholder: 'Parameter',
            valuePlaceholder: 'Value',
            helperMessage:
              'Additional chat completion parameters to send to the API. If the value appears to be a number, it will be sent as a number.',
          },
        ],
      },
    ];
  },

  getBody: (data: ChatNodeData): string | undefined => {
    return dedent`
      ${data.endpoint ? `${data.endpoint}` : ''}
      ${data.useMaxTokensInput ? 'Max Tokens: (Using Input)' : `${data.maxTokens} tokens`}
      Model: ${data.useModelInput ? '(Using Input)' : data.overrideModel || data.model}
      ${data.useTopP ? 'Top P' : 'Temperature'}:
      ${
        data.useTopP
          ? data.useTopPInput
            ? '(Using Input)'
            : data.top_p
          : data.useTemperatureInput
            ? '(Using Input)'
            : data.temperature
      }
      ${data.useStop ? `Stop: ${data.useStopInput ? '(Using Input)' : data.stop}` : ''}
      ${
        (data.frequencyPenalty ?? 0) !== 0
          ? `Frequency Penalty: ${data.useFrequencyPenaltyInput ? '(Using Input)' : data.frequencyPenalty}`
          : ''
      }
      ${
        (data.presencePenalty ?? 0) !== 0
          ? `Presence Penalty: ${data.usePresencePenaltyInput ? '(Using Input)' : data.presencePenalty}`
          : ''
      }
    `.trim();
  },

  process: async (
    data: ChatNodeData,
    node: ChartNode,
    inputs: Inputs,
    context: InternalProcessContext,
  ): Promise<Outputs> => {
    const output: Outputs = {};

    const model = getInputOrData(data, inputs, 'model');
    const temperature = getInputOrData(data, inputs, 'temperature', 'number');

    const topP = data.useTopPInput ? coerceTypeOptional(inputs['top_p' as PortId], 'number') ?? data.top_p : data.top_p;

    const useTopP = getInputOrData(data, inputs, 'useTopP', 'boolean');
    const stop = data.useStopInput
      ? data.useStop
        ? coerceTypeOptional(inputs['stop' as PortId], 'string') ?? data.stop
        : undefined
      : data.stop;

    const presencePenalty = getInputOrData(data, inputs, 'presencePenalty', 'number');
    const frequencyPenalty = getInputOrData(data, inputs, 'frequencyPenalty', 'number');
    const numberOfChoices = getInputOrData(data, inputs, 'numberOfChoices', 'number');
    const endpoint = getInputOrData(data, inputs, 'endpoint');
    const overrideModel = getInputOrData(data, inputs, 'overrideModel');
    const seed = getInputOrData(data, inputs, 'seed', 'number');
    const responseFormat = getInputOrData(data, inputs, 'responseFormat') as 'text' | 'json' | 'json_schema' | '';
    const toolChoiceMode = getInputOrData(data, inputs, 'toolChoice', 'string') as 'none' | 'auto' | 'function';
    const parallelFunctionCalling = getInputOrData(data, inputs, 'parallelFunctionCalling', 'boolean');

    const predictedOutput = data.usePredictedOutput
      ? coerceTypeOptional(inputs['predictedOutput' as PortId], 'string[]')
      : undefined;

    const toolChoice: ChatCompletionOptions['tool_choice'] =
      !toolChoiceMode || !data.enableFunctionUse
        ? undefined
        : toolChoiceMode === 'function'
          ? {
              type: 'function',
              function: {
                name: getInputOrData(data, inputs, 'toolChoiceFunction', 'string'),
              },
            }
          : toolChoiceMode;

    let responseSchema: object | undefined;

    const responseSchemaInput = inputs['responseSchema' as PortId];
    if (responseSchemaInput?.type === 'gpt-function') {
      responseSchema = responseSchemaInput.value.parameters;
    } else if (responseSchemaInput != null) {
      responseSchema = coerceType(responseSchemaInput, 'object');
    }

    const openaiResponseFormat = !responseFormat?.trim()
      ? undefined
      : responseFormat === 'json'
        ? ({
            type: 'json_object',
          } as const)
        : responseFormat === 'json_schema'
          ? {
              type: 'json_schema' as const,
              json_schema: {
                name: getInputOrData(data, inputs, 'responseSchemaName', 'string') || 'response_schema',
                strict: true,
                schema: responseSchema ?? {},
              },
            }
          : ({
              type: 'text',
            } as const);

    const headersFromData = (data.headers ?? []).reduce(
      (acc, header) => {
        acc[header.key] = header.value;
        return acc;
      },
      {} as Record<string, string>,
    );
    const additionalHeaders = data.useHeadersInput
      ? (coerceTypeOptional(inputs['headers' as PortId], 'object') as Record<string, string> | undefined) ??
        headersFromData
      : headersFromData;

    const additionalParametersFromData = (data.additionalParameters ?? []).reduce(
      (acc, param) => {
        acc[param.key] = Number.isNaN(parseFloat(param.value)) ? param.value : parseFloat(param.value);
        return acc;
      },
      {} as Record<string, string | number>,
    );
    const additionalParameters = data.useAdditionalParametersInput
      ? (coerceTypeOptional(inputs['additionalParameters' as PortId], 'object') as
          | Record<string, string>
          | undefined) ?? additionalParametersFromData
      : additionalParametersFromData;

    // If using a model input, that's priority, otherwise override > main
    const finalModel = data.useModelInput && inputs['model' as PortId] != null ? model : overrideModel || model;

    const functions = coerceTypeOptional(inputs['functions' as PortId], 'gpt-function[]');

    const tools = (functions ?? []).map(
      (fn): ChatCompletionTool => ({
        function: fn,
        type: 'function',
      }),
    );

    const { messages } = getChatNodeMessages(inputs);

    const isReasoningModel = finalModel.startsWith('o1') || finalModel.startsWith('o3');

    const completionMessages = await Promise.all(
      messages.map((message) => chatMessageToOpenAIChatCompletionMessage(message, { isReasoningModel })),
    );

    let { maxTokens } = data;

    const openaiModel = {
      ...(openaiModels[model as keyof typeof openaiModels] ?? {
        maxTokens: data.overrideMaxTokens ?? 8192,
        cost: {
          completion: 0,
          prompt: 0,
        },
        displayName: 'Custom Model',
      }),
    };

    if (data.overrideMaxTokens) {
      openaiModel.maxTokens = data.overrideMaxTokens;
    }

    const isMultiResponse = data.useNumberOfChoicesInput || (data.numberOfChoices ?? 1) > 1;

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

    let inputTokenCount: number = 0;

    const tokenizerInfo: TokenizerCallInfo = {
      node,
      model: finalModel,
      endpoint: resolvedEndpointAndHeaders.endpoint,
    };

    if (!data.useServerTokenCalculation) {
      inputTokenCount = await context.tokenizer.getTokenCountForMessages(messages, functions, tokenizerInfo);

      if (inputTokenCount >= openaiModel.maxTokens) {
        throw new Error(
          `The model ${model} can only handle ${openaiModel.maxTokens} tokens, but ${inputTokenCount} were provided in the prompts alone.`,
        );
      }

      if (inputTokenCount + maxTokens > openaiModel.maxTokens) {
        const message = `The model can only handle a maximum of ${
          openaiModel.maxTokens
        } tokens, but the prompts and max tokens together exceed this limit. The max tokens has been reduced to ${
          openaiModel.maxTokens - inputTokenCount
        }.`;
        addWarning(output, message);
        maxTokens = Math.floor((openaiModel.maxTokens - inputTokenCount) * 0.95); // reduce max tokens by 5% to be safe, calculation is a little wrong.
      }
    }

    const predictionObject = predictedOutput
      ? predictedOutput.length === 1
        ? { type: 'content' as const, content: predictedOutput[0]! }
        : { type: 'content' as const, content: predictedOutput.map((part) => ({ type: 'text', text: part })) }
      : undefined;

    const voice = getInputOrData(data, inputs, 'audioVoice');

    let modalities: ('text' | 'audio')[] | undefined = [];
    if (data.modalitiesIncludeText) {
      modalities.push('text');
    }
    if (data.modalitiesIncludeAudio) {
      modalities.push('audio');

      if (!voice) {
        throw new Error('Audio voice must be specified if audio is enabled.');
      }
    }

    // Errors happen if modalities isn't supported, so omit it if it's empty
    if (modalities.length === 0) {
      modalities = undefined;
    }

    const audio = modalities?.includes('audio')
      ? {
          voice,
          format:
            (getInputOrData(data, inputs, 'audioFormat') as 'wav' | 'mp3' | 'flac' | 'opus' | 'pcm16' | undefined) ??
            'wav',
        }
      : undefined;

    const reasoningEffort = getInputOrData(data, inputs, 'reasoningEffort') as '' | 'low' | 'medium' | 'high';

    const supported =
      (openaiModels[finalModel as keyof typeof openaiModels] as OpenAIModel | undefined)?.supported ??
      defaultOpenaiSupported;

    try {
      return await retry(
        async () => {
          const options: Omit<ChatCompletionOptions, 'auth' | 'signal'> = {
            messages: completionMessages,
            model: finalModel,
            top_p: useTopP ? topP : undefined,
            n: numberOfChoices,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            stop: stop || undefined,
            tools: tools.length > 0 ? tools : undefined,
            endpoint: resolvedEndpointAndHeaders.endpoint,
            seed,
            response_format: openaiResponseFormat,
            tool_choice: toolChoice,
            parallel_tool_calls:
              tools.length > 0 && supported.parallelFunctionCalls ? parallelFunctionCalling : undefined,
            prediction: predictionObject,
            modalities,
            audio,
            reasoning_effort: reasoningEffort || undefined,
            ...additionalParameters,
          };

          const isO1Beta = finalModel.startsWith('o1-preview') || finalModel.startsWith('o1-mini');

          if (isReasoningModel) {
            options.max_completion_tokens = maxTokens;
          } else {
            options.temperature = useTopP ? undefined : temperature; // Not supported in o1-preview
            options.max_tokens = maxTokens;
          }

          const cacheKey = JSON.stringify(options);

          if (data.cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
              return cached;
            }
          }

          const startTime = Date.now();

          // Non-streaming APIs
          if (isO1Beta || audio) {
            const response = await chatCompletions({
              auth: {
                apiKey: context.settings.openAiKey ?? '',
                organization: context.settings.openAiOrganization,
              },
              headers: allAdditionalHeaders,
              signal: context.signal,
              timeout: context.settings.chatNodeTimeout,
              ...options,
            });

            if ('error' in response) {
              throw new OpenAIError(400, response.error);
            }

            if (isMultiResponse) {
              output['response' as PortId] = {
                type: 'string[]',
                value: response.choices.map((c) => c.message.content!),
              };
            } else {
              output['response' as PortId] = {
                type: 'string',
                value: response.choices[0]!.message.content! ?? '',
              };
            }

            if (!isMultiResponse) {
              output['all-messages' as PortId] = {
                type: 'chat-message[]',
                value: [
                  ...messages,
                  {
                    type: 'assistant',
                    message: response.choices[0]!.message.content! ?? '',
                    function_calls: undefined,
                    isCacheBreakpoint: false,
                    function_call: undefined,
                  },
                ],
              };
            }

            if (modalities?.includes('audio')) {
              const audioData = response.choices[0]!.message.audio;

              output['audio' as PortId] = {
                type: 'audio',
                value: {
                  data: base64ToUint8Array(audioData!.data),
                  mediaType: audioFormatToMediaType(audio!.format),
                },
              };

              output['audioTranscript' as PortId] = {
                type: 'string',
                value: response.choices[0]!.message.audio!.transcript,
              };
            }

            output['duration' as PortId] = { type: 'number', value: Date.now() - startTime };

            if (response.usage) {
              output['usage' as PortId] = {
                type: 'object',
                value: response.usage,
              };

              const costs =
                finalModel in openaiModels ? openaiModels[finalModel as keyof typeof openaiModels].cost : undefined;

              const promptCostPerThousand = costs?.prompt ?? 0;
              const completionCostPerThousand = costs?.completion ?? 0;
              const audioPromptCostPerThousand = costs
                ? 'audioPrompt' in costs
                  ? (costs.audioPrompt as number)
                  : 0
                : 0;
              const audioCompletionCostPerThousand = costs
                ? 'audioCompletion' in costs
                  ? (costs.audioCompletion as number)
                  : 0
                : 0;

              const promptCost = getCostForTokens(
                response.usage.prompt_tokens_details.text_tokens,
                promptCostPerThousand,
              );
              const completionCost = getCostForTokens(
                response.usage.completion_tokens_details.text_tokens,
                completionCostPerThousand,
              );
              const audioPromptCost = getCostForTokens(
                response.usage.prompt_tokens_details.audio_tokens,
                audioPromptCostPerThousand,
              );
              const audioCompletionCost = getCostForTokens(
                response.usage.completion_tokens_details.audio_tokens,
                audioCompletionCostPerThousand,
              );

              output['cost' as PortId] = {
                type: 'number',
                value: promptCost + completionCost + audioPromptCost + audioCompletionCost,
              };
            }

            Object.freeze(output);
            cache.set(cacheKey, output);

            return output;
          }

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

          let usage: ChatCompletionChunkUsage | undefined;

          let throttleLastCalledTime = Date.now();
          const onPartialOutput = (output: Outputs) => {
            const now = Date.now();
            if (now - throttleLastCalledTime > (context.settings.throttleChatNode ?? 100)) {
              context.onPartialOutputs?.(output);
              throttleLastCalledTime = now;
            }
          };

          for await (const chunk of chunks) {
            if (chunk.usage) {
              usage = chunk.usage;
            }

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
                if (data.parallelFunctionCalling) {
                  output['function-calls' as PortId] = {
                    type: 'object[]',
                    value: functionCalls[0]!.map((functionCall) => ({
                      name: functionCall.name,
                      arguments: functionCall.lastParsedArguments,
                      id: functionCall.id,
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
            }

            onPartialOutput(output);
          }

          // Call one last time manually to ensure the last output is sent
          context.onPartialOutputs?.(output);

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
                  function_calls: functionCalls[0]
                    ? functionCalls[0].map((fc) => ({
                        name: fc.name,
                        arguments: fc.arguments,
                        id: fc.id,
                      }))
                    : undefined,
                },
              ],
            };
          }

          const endTime = Date.now();

          if (responseChoicesParts.length === 0 && functionCalls.length === 0) {
            throw new Error('No response from OpenAI');
          }

          let outputTokenCount = 0;

          if (usage) {
            inputTokenCount = usage.prompt_tokens;
            outputTokenCount = usage.completion_tokens;
          }

          output['in-messages' as PortId] = { type: 'chat-message[]', value: messages };
          output['requestTokens' as PortId] = { type: 'number', value: inputTokenCount * (numberOfChoices ?? 1) };

          if (!data.useServerTokenCalculation) {
            let responseTokenCount = 0;
            for (const choiceParts of responseChoicesParts) {
              responseTokenCount += await context.tokenizer.getTokenCountForString(choiceParts.join(), tokenizerInfo);
            }
            outputTokenCount = responseTokenCount;
          }

          output['responseTokens' as PortId] = { type: 'number', value: outputTokenCount };

          const outputTokensForCostCalculation = usage?.completion_tokens_details
            ? usage.completion_tokens_details.rejected_prediction_tokens > 0
              ? usage.completion_tokens_details.rejected_prediction_tokens
              : usage.completion_tokens
            : outputTokenCount;

          const promptCostPerThousand =
            model in openaiModels ? openaiModels[model as keyof typeof openaiModels].cost.prompt : 0;
          const completionCostPerThousand =
            model in openaiModels ? openaiModels[model as keyof typeof openaiModels].cost.completion : 0;

          const promptCost = getCostForTokens(inputTokenCount, promptCostPerThousand);
          const completionCost = getCostForTokens(outputTokensForCostCalculation, completionCostPerThousand);

          const cost = promptCost + completionCost;

          if (usage) {
            output['usage' as PortId] = {
              type: 'object',
              value: {
                ...usage,
                prompt_cost: promptCost,
                completion_cost: completionCost,
                total_cost: cost,
              },
            };
          } else {
            output['usage' as PortId] = {
              type: 'object',
              value: {
                prompt_tokens: inputTokenCount,
                completion_tokens: outputTokenCount,
              },
            };
          }

          output['cost' as PortId] = { type: 'number', value: cost };
          output['__hidden_token_count' as PortId] = { type: 'number', value: inputTokenCount + outputTokenCount };

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
          onFailedAttempt(originalError) {
            let err = originalError;
            if (originalError.toString().includes('fetch failed') && originalError.cause) {
              const cause =
                getError(originalError.cause) instanceof AggregateError
                  ? (originalError.cause as AggregateError).errors[0]
                  : getError(originalError.cause);

              err = cause;
            }

            if (context.signal.aborted) {
              throw new Error('Aborted');
            }

            context.trace(`ChatNode failed, retrying: ${err.toString()}`);

            const { retriesLeft } = err;

            // Retry network errors
            if (
              err.toString().includes('terminated') ||
              originalError.toString().includes('terminated') ||
              err.toString().includes('fetch failed')
            ) {
              return;
            }

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

            if (err.status === 408) {
              if (retriesLeft) {
                context.onPartialOutputs?.({
                  ['response' as PortId]: {
                    type: 'string',
                    value: 'OpenAI API timed out, retrying...',
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
      throw new Error(`Error processing ChatNode: ${(error as Error).message}`, { cause: error });
    }
  },
};

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
    if (messages.length > 0 && messages.at(0)!.type === 'system') {
      // Delete the first system message if it's already there
      messages.splice(0, 1);
    }

    messages = [{ type: 'system', message: coerceType(systemPrompt, 'string') }, ...messages];
  }

  return { messages, systemPrompt };
}

export function getCostForTokens(tokenCount: number, costPerThousand: number) {
  return (tokenCount / 1000) * costPerThousand;
}

function audioFormatToMediaType(format: 'wav' | 'mp3' | 'flac' | 'opus' | 'pcm16') {
  switch (format) {
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mpeg';
    case 'flac':
      return 'audio/flac';
    case 'opus':
      return 'audio/opus';
    case 'pcm16':
      return 'audio/wav';
  }
}
