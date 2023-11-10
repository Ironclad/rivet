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
import { openAIFilePurposeOptions, type OpenAIFile } from '../../../utils/openai.js';

export type ListOpenAIFilesNode = ChartNode<'openaiListFiles', ListOpenAIFilesNodeData>;

export type ListOpenAIFilesNodeData = {
  purpose?: 'fine-tune' | 'fine-tune-results' | 'assistants' | 'assistants_output';
  usePurposeInput?: boolean;
};

export const ListOpenAIFilesNodeImpl: PluginNodeImpl<ListOpenAIFilesNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiListFiles',
      data: {
        purpose: 'assistants',
      },
      title: 'List OpenAI Files',
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
      contextMenuTitle: 'List OpenAI Files',
      infoBoxTitle: 'List OpenAI Files Node',
      infoBoxBody: 'List files from OpenAI.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.usePurposeInput) {
      inputs.push({
        id: 'purpose' as PortId,
        dataType: 'string',
        title: 'Purpose',
        coerced: true,
        defaultValue: '',
        description: 'Retrieve only files with the specified purpose.',
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'files' as PortId,
        dataType: 'object[]',
        title: 'Files',
        description: 'The list of files.',
      },
    ];
  },

  getEditors(): EditorDefinition<ListOpenAIFilesNode>[] {
    return [
      {
        type: 'dropdown',
        dataKey: 'purpose',
        useInputToggleDataKey: 'usePurposeInput',
        label: 'Purpose',
        options: openAIFilePurposeOptions,
        defaultValue: 'assistants',
      },
    ];
  },

  getBody(data) {
    return dedent`
      Purpose: ${openAIFilePurposeOptions.find(({ value }) => value === data.purpose)?.label ?? 'Unknown'}
    `;
  },

  async process(data, inputData, context) {
    const purpose = getInputOrData(data, inputData, 'purpose');

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const url = `https://api.openai.com/v1/files?purpose=${purpose}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
    });

    await handleOpenAIError(response);

    const body = (await response.json()) as {
      object: 'list';
      data: OpenAIFile[];
    };

    return {
      ['files' as PortId]: {
        type: 'object[]',
        value: body.data,
      },
    };
  },
};

export const listOpenAIFilesNode = pluginNodeDefinition(ListOpenAIFilesNodeImpl, 'List OpenAI Files');
