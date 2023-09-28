import { nanoid } from 'nanoid/non-secure';
import {
  type ChartNode,
  type EditorDefinition,
  type NodeBodySpec,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type NodeUIData,
  type Outputs,
  type PluginNodeImpl,
  type PortId,
} from '../../../index.js';
import { HfInference, HfInferenceEndpoint } from '@huggingface/inference';
import { getInputOrData } from '../../../utils/inputs.js';
import { coerceType } from '../../../utils/coerceType.js';
import { dedent } from '../../../utils/misc.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';

export type ChatHuggingFaceNode = ChartNode<'chatHuggingFace', ChatHuggingFaceNodeData>;

export type ChatHuggingFaceNodeData = {
  model: string;
  useModelInput?: boolean;

  endpoint?: string;
  useEndpointInput?: boolean;

  temperature?: number;
  useTemperatureInput?: boolean;

  maxNewTokens: number;
  useMaxNewTokensInput?: boolean;

  doSample: boolean;
  useDoSampleInput?: boolean;

  maxTime?: number;
  useMaxTimeInput?: boolean;

  repetitionPenalty?: number;
  useRepetitionPenaltyInput?: boolean;

  topP?: number;
  useTopPInput?: boolean;

  topK?: number;
  useTopKInput?: boolean;
};

export const ChatHuggingFaceNodeImpl: PluginNodeImpl<ChatHuggingFaceNode> = {
  create(): ChatHuggingFaceNode {
    return {
      id: nanoid() as NodeId,
      type: 'chatHuggingFace',
      data: {
        model: '',
        temperature: 0.5,
        maxNewTokens: 1024,
        doSample: false,
      },
      title: 'Chat (Hugging Face)',
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
    };
  },

  getUIData(): NodeUIData {
    return {
      group: ['AI', 'Hugging Face'],
      contextMenuTitle: 'Chat (Hugging Face)',
      infoBoxTitle: 'Chat (Hugging Face) Node',
      infoBoxBody: 'Chat, using the hugging face inference API',
    };
  },

  getInputDefinitions(data): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'prompt' as PortId,
      dataType: 'string',
      title: 'Prompt',
      required: true,
    });

    if (data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        dataType: 'string',
        title: 'Model',
      });
    }

    if (data.useEndpointInput) {
      inputs.push({
        id: 'endpoint' as PortId,
        dataType: 'string',
        title: 'Endpoint',
      });
    }

    if (data.useTemperatureInput) {
      inputs.push({
        id: 'temperature' as PortId,
        dataType: 'number',
        title: 'Temperature',
      });
    }

    if (data.useMaxNewTokensInput) {
      inputs.push({
        id: 'maxNewTokens' as PortId,
        dataType: 'number',
        title: 'Max New Tokens',
      });
    }

    if (data.useDoSampleInput) {
      inputs.push({
        id: 'doSample' as PortId,
        dataType: 'boolean',
        title: 'Do Sample',
      });
    }

    if (data.useMaxTimeInput) {
      inputs.push({
        id: 'maxTime' as PortId,
        dataType: 'number',
        title: 'Max Time (s)',
      });
    }

    if (data.useRepetitionPenaltyInput) {
      inputs.push({
        id: 'repetitionPenalty' as PortId,
        dataType: 'number',
        title: 'Repetition Penalty',
      });
    }

    if (data.useTopPInput) {
      inputs.push({
        id: 'topP' as PortId,
        dataType: 'number',
        title: 'Top P',
      });
    }

    if (data.useTopKInput) {
      inputs.push({
        id: 'topK' as PortId,
        dataType: 'number',
        title: 'Top K',
      });
    }

    return inputs;
  },

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        dataType: 'string',
        title: 'Output',
      },
    ];
  },

  getEditors(): EditorDefinition<ChatHuggingFaceNode>[] {
    return [
      {
        type: 'string',
        label: 'Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
      },
      {
        type: 'string',
        label: 'Endpoint',
        dataKey: 'endpoint',
        useInputToggleDataKey: 'useEndpointInput',
      },
      {
        type: 'number',
        label: 'Temperature (0-100)',
        dataKey: 'temperature',
        useInputToggleDataKey: 'useTemperatureInput',
        min: 0,
        step: 50,
        allowEmpty: true,
      },
      {
        type: 'number',
        label: 'Max New Tokens',
        dataKey: 'maxNewTokens',
        useInputToggleDataKey: 'useMaxNewTokensInput',
        min: 0,
        step: 1,
      },
      {
        type: 'toggle',
        label: 'Do Sample',
        dataKey: 'doSample',
        useInputToggleDataKey: 'useDoSampleInput',
      },
      {
        type: 'number',
        label: 'Max Time (s)',
        dataKey: 'maxTime',
        useInputToggleDataKey: 'useMaxTimeInput',
        allowEmpty: true,
      },
      {
        type: 'number',
        label: 'Repetition Penalty (0-100)',
        dataKey: 'repetitionPenalty',
        useInputToggleDataKey: 'useRepetitionPenaltyInput',
        allowEmpty: true,
      },
      {
        type: 'number',
        label: 'Top P (0-100)',
        dataKey: 'topP',
        useInputToggleDataKey: 'useTopPInput',
        allowEmpty: true,
      },
      {
        type: 'number',
        label: 'Top K (0-100)',
        dataKey: 'topK',
        useInputToggleDataKey: 'useTopKInput',
        allowEmpty: true,
      },
    ];
  },

  getBody(data): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return dedent`
      ${
        data.endpoint || data.useEndpointInput
          ? `Endpoint: ${data.useEndpointInput ? '(Using Input)' : 'Yes'}`
          : `Model: ${data.useModelInput ? '(Using Input)' : data.model}`
      }
      ${
        data.useTemperatureInput
          ? 'Temperature: (Using Input)'
          : data.temperature != null
          ? `Temperature: ${data.temperature}`
          : ''
      }
      Max New Tokens: ${data.useMaxNewTokensInput ? '(Using Input)' : data.maxNewTokens}
    `;
  },

  async process(data, inputData, context): Promise<Outputs> {
    const accessToken = context.getPluginConfig('huggingFaceAccessToken');

    const prompt = coerceType(inputData['prompt' as PortId], 'string');
    const endpoint = getInputOrData(data, inputData, 'endpoint');

    const model = getInputOrData(data, inputData, 'model');
    const temperature = getInputOrData(data, inputData, 'temperature', 'number');
    const maxNewTokens = getInputOrData(data, inputData, 'maxNewTokens', 'number');
    const doSample = getInputOrData(data, inputData, 'doSample', 'boolean');
    const maxTime = getInputOrData(data, inputData, 'maxTime', 'number');
    const repetitionPenalty = getInputOrData(data, inputData, 'repetitionPenalty', 'number');
    const topP = getInputOrData(data, inputData, 'topP', 'number');
    const topK = getInputOrData(data, inputData, 'topK', 'number');

    const hf = endpoint ? new HfInferenceEndpoint(endpoint, accessToken) : new HfInference(accessToken);

    const generationStream = hf.textGenerationStream({
      inputs: prompt,
      model,
      parameters: {
        temperature,
        max_new_tokens: maxNewTokens,
        do_sample: doSample,
        max_time: maxTime,
        repetition_penalty: repetitionPenalty,
        top_p: topP,
        top_k: topK,
      },
    });

    const parts = [];

    for await (const { token } of generationStream) {
      if (!token.special) {
        parts.push(token.text);
      }

      context.onPartialOutputs?.({
        ['output' as PortId]: {
          type: 'string',
          value: parts.join(''),
        },
      });
    }

    return {
      ['output' as PortId]: {
        type: 'string',
        value: parts.join(''),
      },
    };
  },
};

export const chatHuggingFaceNode = pluginNodeDefinition(ChatHuggingFaceNodeImpl, 'Chat (Hugging Face)');
