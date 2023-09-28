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
import { dedent } from 'ts-dedent';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { getInputOrData } from '../../../utils/inputs.js';
import { coerceType } from '../../../utils/coerceType.js';

export type TextToImageHuggingFaceNode = ChartNode<'textToImageHuggingFace', TextToImageHuggingFaceNodeData>;

export type TextToImageHuggingFaceNodeData = {
  model: string;
  useModelInput?: boolean;

  endpoint?: string;
  useEndpointInput?: boolean;

  width: number;
  useWidthInput?: boolean;

  height: number;
  useHeightInput?: boolean;

  negativePrompt?: string;
  useNegativePromptInput?: boolean;

  guidanceScale: number;
  useGuidanceScaleInput?: boolean;

  numInferenceSteps: number;
  useNumInferenceStepsInput?: boolean;
};

export const TextToImageHuggingFaceNodeImpl: PluginNodeImpl<TextToImageHuggingFaceNode> = {
  create(): TextToImageHuggingFaceNode {
    return {
      id: nanoid() as NodeId,
      type: 'textToImageHuggingFace',
      data: {
        model: '',
        width: 256,
        height: 256,
        negativePrompt: '',
        guidanceScale: 7,
        numInferenceSteps: 3,
      },
      title: 'Text-to-Image (Hugging Face)',
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
      contextMenuTitle: 'Text-to-Image (Hugging Face)',
      infoBoxTitle: 'Text-to-Image (Hugging Face) Node',
      infoBoxBody: 'Use the Hugging Face API to generate an image from text.',
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

    if (data.useWidthInput) {
      inputs.push({
        id: 'width' as PortId,
        dataType: 'number',
        title: 'Width',
      });
    }

    if (data.useHeightInput) {
      inputs.push({
        id: 'height' as PortId,
        dataType: 'number',
        title: 'Height',
      });
    }

    if (data.useNegativePromptInput) {
      inputs.push({
        id: 'negativePrompt' as PortId,
        dataType: 'string',
        title: 'Negative Prompt',
      });
    }

    if (data.useGuidanceScaleInput) {
      inputs.push({
        id: 'guidanceScale' as PortId,
        dataType: 'number',
        title: 'Guidance Scale',
      });
    }

    if (data.useNumInferenceStepsInput) {
      inputs.push({
        id: 'numInferenceSteps' as PortId,
        dataType: 'number',
        title: 'Num Inference Steps',
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

  getEditors(): EditorDefinition<TextToImageHuggingFaceNode>[] {
    return [
      {
        type: 'string',
        label: 'Model',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
      },
      {
        type: 'number',
        label: 'Width',
        dataKey: 'width',
        useInputToggleDataKey: 'useWidthInput',
      },
      {
        type: 'number',
        label: 'Height',
        dataKey: 'height',
        useInputToggleDataKey: 'useHeightInput',
      },
      {
        type: 'string',
        label: 'Negative Prompt',
        dataKey: 'negativePrompt',
        useInputToggleDataKey: 'useNegativePromptInput',
      },
      {
        type: 'number',
        label: 'Guidance Scale',
        dataKey: 'guidanceScale',
        useInputToggleDataKey: 'useGuidanceScaleInput',
        min: 0,
        max: 20,
        step: 1,
      },
      {
        type: 'number',
        label: 'Num Inference Steps',
        dataKey: 'numInferenceSteps',
        useInputToggleDataKey: 'useNumInferenceStepsInput',
        min: 0,
        max: 20,
        step: 1,
      },
    ];
  },

  getBody(data): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return dedent`
      Model: ${data.useModelInput ? '(Using Input)' : data.model}
    `;
  },

  async process(data, inputData, context): Promise<Outputs> {
    const accessToken = context.getPluginConfig('huggingFaceAccessToken');

    const prompt = coerceType(inputData['prompt' as PortId], 'string');
    const endpoint = getInputOrData(data, inputData, 'endpoint');

    const model = getInputOrData(data, inputData, 'model');
    const width = getInputOrData(data, inputData, 'width', 'number');
    const height = getInputOrData(data, inputData, 'height', 'number');
    const negativePrompt = getInputOrData(data, inputData, 'negativePrompt') || undefined;
    const guidanceScale = getInputOrData(data, inputData, 'guidanceScale', 'number');
    const numInferenceSteps = getInputOrData(data, inputData, 'numInferenceSteps', 'number');

    const hf = endpoint ? new HfInferenceEndpoint(endpoint, accessToken) : new HfInference(accessToken);

    const image = await hf.textToImage({
      inputs: prompt,
      model,
      parameters: {
        width,
        height,
        negative_prompt: negativePrompt,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
      },
    });

    return {
      ['output' as PortId]: {
        type: 'image',
        value: {
          mediaType: 'image/png',
          data: new Uint8Array(await image.arrayBuffer()),
        },
      },
    };
  },
};

export const textToImageHuggingFaceNode = pluginNodeDefinition(
  TextToImageHuggingFaceNodeImpl,
  'Text-to-Image (Hugging Face)',
);
