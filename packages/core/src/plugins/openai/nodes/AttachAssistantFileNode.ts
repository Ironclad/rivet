import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import type { OpenAIAssistantFile, OpenAIFile } from '../../../utils/openai.js';
import { dedent, newId, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type AttachAssistantFileNode = ChartNode<'openaiAttachAssistantFile', AttachAssistantFileNodeData>;

export type AttachAssistantFileNodeData = {
  assistantId?: string;
  useAssistantIdInput?: boolean;
  fileId?: string;
  useFileIdInput?: boolean;
};

export const AttachAssistantFileNodeImpl: PluginNodeImpl<AttachAssistantFileNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiAttachAssistantFile',
      data: {
        useAssistantIdInput: true,
        useFileIdInput: true,
      },
      title: 'Attach Assistant File',
      visualData: {
        x: 0,
        y: 0,
        width: 225,
      },
    };
  },

  getUIData() {
    return {
      group: 'OpenAI',
      contextMenuTitle: 'Attach Assistant File',
      infoBoxTitle: 'Attach Assistant File Node',
      infoBoxBody: 'Attach a file to an OpenAI assistant.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useAssistantIdInput) {
      inputs.push({
        id: 'assistantId' as PortId,
        dataType: 'string',
        title: 'Assistant ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the assistant to attach the file to.',
        required: true,
      });
    }

    if (data.useFileIdInput) {
      inputs.push({
        id: 'fileId' as PortId,
        dataType: 'string',
        title: 'File ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the file to attach.',
        required: true,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'fileId' as PortId,
        dataType: 'string',
        title: 'File ID',
        description: 'The ID of the attached file.',
      },
    ];
  },

  getEditors(): EditorDefinition<AttachAssistantFileNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'assistantId',
        useInputToggleDataKey: 'useAssistantIdInput',
        label: 'Assistant ID',
      },
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
      Assistant ID: ${data.useAssistantIdInput ? '(From Input)' : data.assistantId}
      File ID: ${data.useFileIdInput ? '(From Input)' : data.fileId}
    `;
  },

  async process(data, inputData, context) {
    const assistantId = getInputOrData(data, inputData, 'assistantId');
    const fileId = getInputOrData(data, inputData, 'fileId');

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const url = `https://api.openai.com/v1/assistants/${assistantId}/files`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
      body: JSON.stringify({ file_id: fileId }),
    });

    if (response.status === 404) {
      return {
        ['fileId' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    await handleOpenAIError(response);

    const body = (await response.json()) as OpenAIAssistantFile;

    return {
      ['fileId' as PortId]: {
        type: 'string',
        value: body.id,
      },
    };
  },
};

export const attachAssistantFileNode = pluginNodeDefinition(AttachAssistantFileNodeImpl, 'Attach Assistant File');
