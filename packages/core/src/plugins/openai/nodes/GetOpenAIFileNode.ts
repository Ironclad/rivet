import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import { newId, getInputOrData, dedent } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type GetOpenAIFileNode = ChartNode<'openaiGetFile', GetOpenAIFileNodeData>;

export type GetOpenAIFileNodeData = {
  fileId?: string;
  useFileIdInput?: boolean;
};

export const GetOpenAIFileNodeImpl: PluginNodeImpl<GetOpenAIFileNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiGetFile',
      data: {
        useFileIdInput: true,
      },
      title: 'Get OpenAI File',
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
      contextMenuTitle: 'Get OpenAI File',
      infoBoxTitle: 'Get OpenAI File Node',
      infoBoxBody: 'Get a specific file from OpenAI.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useFileIdInput) {
      inputs.push({
        id: 'fileId' as PortId,
        dataType: 'string',
        title: 'File ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the file to retrieve.',
        required: true,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'file' as PortId,
        dataType: 'object',
        title: 'File',
        description: 'The retrieved file object.',
      },
    ];
  },

  getEditors(): EditorDefinition<GetOpenAIFileNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'fileId',
        useInputToggleDataKey: 'useFileIdInput',
        label: 'File ID',
      },
    ];
  },

  getBody(data) {
    return dedent`
      File ID: ${data.fileId ?? 'Unknown'}
    `;
  },

  async process(data, inputData, context) {
    const fileId = getInputOrData(data, inputData, 'fileId');

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const url = `https://api.openai.com/v1/files/${fileId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
    });

    if (response.status === 404) {
      return {
        ['file' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    await handleOpenAIError(response);

    const body = await response.json();

    return {
      ['file' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const getOpenAIFileNode = pluginNodeDefinition(GetOpenAIFileNodeImpl, 'Get OpenAI File');
