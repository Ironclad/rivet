import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import type { CreateMessageBody, OpenAIThreadMessage } from '../../../utils/openai.js';
import { dedent, newId, coerceTypeOptional, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type CreateThreadMessageNode = ChartNode<'openaiCreateThreadMessage', CreateThreadMessageNodeData>;

export type CreateThreadMessageNodeData = {
  threadId: string;
  useThreadIdInput?: boolean;

  file_ids: string[];
  useFileIdsInput?: boolean;

  metadata: { key: string; value: string }[];
  useMetadataInput?: boolean;
};

export const CreateThreadMessageNodeImpl: PluginNodeImpl<CreateThreadMessageNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiCreateThreadMessage',
      data: {
        threadId: '',
        useThreadIdInput: true,
        file_ids: [],
        useFileIdsInput: false,
        metadata: [],
        useMetadataInput: false,
      },
      title: 'Create Thread Message',
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
      contextMenuTitle: 'Create Thread Message',
      infoBoxTitle: 'Create Thread Message Node',
      infoBoxBody: 'Create a new message for an OpenAI thread.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'content' as PortId,
      dataType: 'string',
      title: 'Content',
      coerced: true,
      defaultValue: '',
      description: 'The content of the message.',
    });

    if (data.useThreadIdInput) {
      inputs.push({
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the thread to post the message to.',
        required: true,
      });
    }

    if (data.useFileIdsInput) {
      inputs.push({
        id: 'file_ids' as PortId,
        dataType: 'string[]',
        title: 'File IDs',
        coerced: true,
        defaultValue: [],
        description: 'A list of file IDs attached to this message.',
        required: false,
      });
    }

    if (data.useMetadataInput) {
      inputs.push({
        id: 'metadata' as PortId,
        dataType: 'object',
        title: 'Metadata',
        coerced: true,
        defaultValue: {},
        description: 'Metadata to attach to the message.',
        required: false,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'messageId' as PortId,
        dataType: 'string',
        title: 'Message ID',
        description: 'The ID of the created message.',
      },
      {
        id: 'message' as PortId,
        dataType: 'object',
        title: 'Message',
        description: 'The full created message object.',
      },
    ];
  },

  getEditors(): EditorDefinition<CreateThreadMessageNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'threadId',
        useInputToggleDataKey: 'useThreadIdInput',
        label: 'Thread ID',
        placeholder: 'Enter thread ID',
        helperMessage: 'The ID of the thread to post the message to.',
      },
      {
        type: 'stringList',
        dataKey: 'file_ids',
        useInputToggleDataKey: 'useFileIdsInput',
        label: 'File IDs',
      },
      {
        type: 'keyValuePair',
        dataKey: 'metadata',
        useInputToggleDataKey: 'useMetadataInput',
        label: 'Metadata',
        keyPlaceholder: 'Key',
        valuePlaceholder: 'Value',
      },
    ];
  },

  getBody(data) {
    return dedent`
      Thread ID: ${data.useThreadIdInput ? '(Thread ID From Input)' : data.threadId}${
      data.useFileIdsInput || data.file_ids.length > 0
        ? `File IDs: ${data.useFileIdsInput ? '(File IDs From Input)' : JSON.stringify(data.file_ids)}\n`
        : ''
    }${
      data.useMetadataInput || data.metadata.length > 0
        ? `Metadata: ${
            data.useMetadataInput
              ? '(Metadata From Input)'
              : data.metadata.map(({ key, value }) => `${key}=${value}`).join(', ')
          }\n`
        : ''
    }
    `;
  },

  async process(data, inputData, context) {
    const threadId = getInputOrData(data, inputData, 'threadId');
    const content = coerceTypeOptional(inputData['content' as PortId], 'string') ?? '';

    let metadata = data.metadata.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    if (data.useMetadataInput && inputData['metadata' as PortId]) {
      metadata = coerceTypeOptional(inputData['metadata' as PortId], 'object') as Record<string, string>;
    }

    const requestBody: CreateMessageBody = {
      role: 'user',
      content,
      file_ids: getInputOrData(data, inputData, 'file_ids', 'string[]'),
      metadata,
    };

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const url = `https://api.openai.com/v1/threads/${threadId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
      body: JSON.stringify(requestBody),
    });

    await handleOpenAIError(response);

    const body = (await response.json()) as OpenAIThreadMessage;

    return {
      ['messageId' as PortId]: {
        type: 'string',
        value: body.id,
      },
      ['message' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const createThreadMessageNode = pluginNodeDefinition(CreateThreadMessageNodeImpl, 'Create Thread Message');
