import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import { newId, dedent, getInputOrData, coerceType, coerceTypeOptional } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';
import { openAIFileUploadPurposeOptions } from '../../../utils/openai.js';

export type UploadFileNode = ChartNode<'openaiUploadFile', UploadFileNodeData>;

export type UploadFileNodeData = {
  purpose: 'fine-tune' | 'assistants' | 'assistants_output';
};

export const UploadFileNodeImpl: PluginNodeImpl<UploadFileNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiUploadFile',
      data: {
        purpose: 'assistants',
      },
      title: 'Upload File to OpenAI',
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
    };
  },

  getUIData() {
    return {
      group: 'OpenAI',
      contextMenuTitle: 'Upload File to OpenAI',
      infoBoxTitle: 'Upload File to OpenAI Node',
      infoBoxBody: 'Upload a file to OpenAI.',
    };
  },

  getInputDefinitions() {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'data' as PortId,
      dataType: 'binary',
      title: 'Data',
      coerced: true,
      defaultValue: '',
      description: 'The binary data of the file to upload.',
      required: true,
    });

    inputs.push({
      id: 'file-name' as PortId,
      dataType: 'string',
      title: 'File Name',
      coerced: true,
      description: 'An optional file name to use for the uploaded file.',
      required: false,
    });

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'fileId' as PortId,
        dataType: 'string',
        title: 'File ID',
        description: 'The ID of the uploaded file.',
      },
      {
        id: 'file' as PortId,
        dataType: 'object',
        title: 'File',
        description: 'The full uploaded file object.',
      },
    ];
  },

  getEditors(): EditorDefinition<UploadFileNode>[] {
    return [
      {
        type: 'dropdown',
        dataKey: 'purpose',
        label: 'Purpose',
        options: openAIFileUploadPurposeOptions,
        defaultValue: 'assistants',
      },
    ];
  },

  getBody(data) {
    return dedent`
      Purpose: ${openAIFileUploadPurposeOptions.find(({ value }) => value === data.purpose)?.label ?? 'Unknown'}
    `;
  },

  async process(data, inputData, context) {
    const purpose = getInputOrData(data, inputData, 'purpose');
    const fileData = coerceType(inputData['data' as PortId], 'binary');
    const fileName = coerceTypeOptional(inputData['file-name' as PortId], 'string');

    if (!fileData) {
      throw new Error('File data is required.');
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const file = fileName
      ? new File([fileData], fileName, { type: 'application/octet-stream' })
      : new Blob([fileData], { type: 'application/octet-stream' });

    const formData = new FormData();
    formData.append('purpose', purpose);
    formData.append('file', file);

    const baseUrl = context.settings.openAiEndpoint || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
      body: formData,
    });

    await handleOpenAIError(response);

    const body = await response.json();

    return {
      ['fileId' as PortId]: {
        type: 'string',
        value: body.id,
      },
      ['file' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const uploadFileNode = pluginNodeDefinition(UploadFileNodeImpl, 'Upload File to OpenAI');
