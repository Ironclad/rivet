import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import type { CreateMessageBody, CreateThreadBody, OpenAIThread } from '../../../utils/openai.js';
import { dedent, newId, coerceTypeOptional, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';

export type CreateThreadNode = ChartNode<'openaiCreateThread', CreateThreadNodeData>;

export type CreateThreadNodeData = {
  threadId?: string;
  useThreadIdInput?: boolean;

  metadata: { key: string; value: string }[];
  useMetadataInput?: boolean;
};

export const CreateThreadNodeImpl: PluginNodeImpl<CreateThreadNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiCreateThread',
      data: {
        metadata: [],
        useMetadataInput: false,
      },
      title: 'Create Thread',
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
      contextMenuTitle: 'Create Thread',
      infoBoxTitle: 'Create Thread Node',
      infoBoxBody: 'Create a new thread for OpenAI assistants.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useThreadIdInput) {
      inputs.push({
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the thread to modify. If not provided, a new thread will be created.',
        required: true,
      });
    }

    inputs.push({
      id: 'messages' as PortId,
      dataType: 'object[]',
      title: 'Messages',
      coerced: true,
      defaultValue: [],
      description: 'A list of user messages to start the thread with.',
      required: false,
    });

    if (data.useMetadataInput) {
      inputs.push({
        id: 'metadata' as PortId,
        dataType: 'object',
        title: 'Metadata',
        coerced: true,
        defaultValue: {},
        description: 'Metadata to attach to the thread.',
        required: false,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        description: 'The ID of the created thread.',
      },
      {
        id: 'thread' as PortId,
        dataType: 'object',
        title: 'Thread',
        description: 'The full created thread object.',
      },
    ];
  },

  getEditors(): EditorDefinition<CreateThreadNode>[] {
    return [
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
      ${data.threadId ? `Thread ID: ${data.threadId}` : 'Create New Thread'}
      ${
        data.useMetadataInput
          ? '(Metadata From Input)'
          : data.metadata.map(({ key, value }) => `${key}=${value}`).join(', ')
      }
    `;
  },

  async process(data, inputData, context) {
    const threadId = getInputOrData(data, inputData, 'threadId') ?? '';

    const messages = coerceTypeOptional(inputData['messages' as PortId], 'object[]') ?? [];

    let metadata: Record<string, string> = data.metadata.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (data.useMetadataInput && inputData['metadata' as PortId]) {
      metadata = coerceTypeOptional(inputData['metadata' as PortId], 'object') as Record<string, string>;
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const messagesFormatted = messages.map((message): CreateMessageBody => {
      if (!('role' in message)) {
        throw new Error('Invalid message format.');
      }

      if (message.role !== 'user') {
        throw new Error('Only user messages are supported.');
      }

      return message as CreateMessageBody;
    });

    const url = threadId.trim() ? `https://api.openai.com/v1/threads/${threadId}` : 'https://api.openai.com/v1/threads';

    if (threadId && messages.length > 0) {
      throw new Error('Cannot provide messages when modifying an existing thread.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
      body: JSON.stringify(
        threadId.trim()
          ? { metadata }
          : ({
              messages: messagesFormatted,
              metadata,
            } satisfies CreateThreadBody),
      ),
    });

    if (!response.ok) {
      throw new Error('Failed to create thread.');
    }

    const body = (await response.json()) as OpenAIThread;

    return {
      ['threadId' as PortId]: {
        type: 'string',
        value: body.id,
      },
      ['thread' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const createThreadNode = pluginNodeDefinition(CreateThreadNodeImpl, 'Create Thread');
