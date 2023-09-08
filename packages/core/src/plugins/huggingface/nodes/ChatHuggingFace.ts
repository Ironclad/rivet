import { nanoid } from 'nanoid';
import {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PortId,
  coerceType,
  getInputOrData,
  nodeDefinition,
} from '../../../index.js';
import { HfInference, HfInferenceEndpoint } from '@huggingface/inference';
import { dedent } from 'ts-dedent';

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

export class ChatHuggingFaceNodeImpl extends NodeImpl<ChatHuggingFaceNode> {
  static create(): ChatHuggingFaceNode {
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
  }

  static getUIData(): NodeUIData {
    return {
      group: ['AI', 'Hugging Face'],
      contextMenuTitle: 'Chat (Hugging Face)',
      infoBoxTitle: 'Chat (Hugging Face) Node',
      infoBoxBody: 'Chat, using the hugging face inference API',
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'prompt' as PortId,
      dataType: 'string',
      title: 'Prompt',
      required: true,
    });

    if (this.data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        dataType: 'string',
        title: 'Model',
      });
    }

    if (this.data.useEndpointInput) {
      inputs.push({
        id: 'endpoint' as PortId,
        dataType: 'string',
        title: 'Endpoint',
      });
    }

    if (this.data.useTemperatureInput) {
      inputs.push({
        id: 'temperature' as PortId,
        dataType: 'number',
        title: 'Temperature',
      });
    }

    if (this.data.useMaxNewTokensInput) {
      inputs.push({
        id: 'maxNewTokens' as PortId,
        dataType: 'number',
        title: 'Max New Tokens',
      });
    }

    if (this.data.useDoSampleInput) {
      inputs.push({
        id: 'doSample' as PortId,
        dataType: 'boolean',
        title: 'Do Sample',
      });
    }

    if (this.data.useMaxTimeInput) {
      inputs.push({
        id: 'maxTime' as PortId,
        dataType: 'number',
        title: 'Max Time (s)',
      });
    }

    if (this.data.useRepetitionPenaltyInput) {
      inputs.push({
        id: 'repetitionPenalty' as PortId,
        dataType: 'number',
        title: 'Repetition Penalty',
      });
    }

    if (this.data.useTopPInput) {
      inputs.push({
        id: 'topP' as PortId,
        dataType: 'number',
        title: 'Top P',
      });
    }

    if (this.data.useTopKInput) {
      inputs.push({
        id: 'topK' as PortId,
        dataType: 'number',
        title: 'Top K',
      });
    }

    return inputs;
  }
  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        dataType: 'string',
        title: 'Output',
      },
    ];
  }

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
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return dedent`
      ${
        this.data.endpoint || this.data.useEndpointInput
          ? `Endpoint: ${this.data.useEndpointInput ? '(Using Input)' : 'Yes'}`
          : `Model: ${this.data.useModelInput ? '(Using Input)' : this.data.model}`
      }
      ${
        this.data.useTemperatureInput
          ? 'Temperature: (Using Input)'
          : this.data.temperature != null
          ? `Temperature: ${this.data.temperature}`
          : ''
      }
      Max New Tokens: ${this.data.useMaxNewTokensInput ? '(Using Input)' : this.data.maxNewTokens}
    `;
  }

  async process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const accessToken = context.getPluginConfig('huggingFaceAccessToken');

    const prompt = coerceType(inputData['prompt' as PortId], 'string');
    const endpoint = getInputOrData(this.data, inputData, 'endpoint');

    const model = getInputOrData(this.data, inputData, 'model');
    const temperature = getInputOrData(this.data, inputData, 'temperature', 'number');
    const maxNewTokens = getInputOrData(this.data, inputData, 'maxNewTokens', 'number');
    const doSample = getInputOrData(this.data, inputData, 'doSample', 'boolean');
    const maxTime = getInputOrData(this.data, inputData, 'maxTime', 'number');
    const repetitionPenalty = getInputOrData(this.data, inputData, 'repetitionPenalty', 'number');
    const topP = getInputOrData(this.data, inputData, 'topP', 'number');
    const topK = getInputOrData(this.data, inputData, 'topK', 'number');

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
  }
}

export const chatHuggingFaceNode = nodeDefinition(ChatHuggingFaceNodeImpl, 'Chat (Hugging Face)');
