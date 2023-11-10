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
import type { ListThreadMessagesQuery, OpenAIListResponse, OpenAIThreadMessage } from '../../../utils/openai.js';

export type ListThreadMessagesNode = ChartNode<'openaiListThreadMessages', ListThreadMessagesNodeData>;

export type ListThreadMessagesNodeData = {
  threadId: string;
  useThreadIdInput?: boolean;

  limit?: number;
  useLimitInput?: boolean;

  order?: string;
  useOrderInput?: boolean;

  after?: string;
  useAfterInput?: boolean;

  before?: string;
  useBeforeInput?: boolean;
};

export const ListThreadMessagesNodeImpl: PluginNodeImpl<ListThreadMessagesNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiListThreadMessages',
      data: {
        threadId: '',
        useThreadIdInput: true,
        limit: 20,
        useLimitInput: false,
        order: 'asc',
        useOrderInput: false,
        after: '',
        useAfterInput: false,
        before: '',
        useBeforeInput: false,
      },
      title: 'List Thread Messages',
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
      contextMenuTitle: 'List Thread Messages',
      infoBoxTitle: 'List Thread Messages Node',
      infoBoxBody: 'List messages from a thread in OpenAI.',
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
        description: 'The ID of the thread to retrieve messages from.',
        required: true,
      });
    }

    if (data.useLimitInput) {
      inputs.push({
        id: 'limit' as PortId,
        dataType: 'number',
        title: 'Limit',
        coerced: true,
        defaultValue: 20,
        description: 'A limit on the number of objects to be returned.',
        required: false,
      });
    }

    if (data.useOrderInput) {
      inputs.push({
        id: 'order' as PortId,
        dataType: 'string',
        title: 'Order',
        coerced: true,
        defaultValue: 'asc',
        description: 'Sort order by the created_at timestamp of the objects.',
        required: false,
      });
    }

    if (data.useAfterInput) {
      inputs.push({
        id: 'after' as PortId,
        dataType: 'string',
        title: 'After',
        coerced: true,
        defaultValue: '',
        description: 'A cursor for use in pagination.',
        required: false,
      });
    }

    if (data.useBeforeInput) {
      inputs.push({
        id: 'before' as PortId,
        dataType: 'string',
        title: 'Before',
        coerced: true,
        defaultValue: '',
        description: 'A cursor for use in pagination.',
        required: false,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'messages' as PortId,
        dataType: 'object[]',
        title: 'Messages',
        description: 'The list of messages.',
      },
      {
        id: 'first_id' as PortId,
        dataType: 'string',
        title: 'First ID',
        description: 'The ID of the first message in the list.',
      },
      {
        id: 'last_id' as PortId,
        dataType: 'string',
        title: 'Last ID',
        description: 'The ID of the last message in the list.',
      },
      {
        id: 'has_more' as PortId,
        dataType: 'boolean',
        title: 'Has More',
        description: 'Whether there are more messages to be retrieved.',
      },
    ];
  },

  getEditors(): EditorDefinition<ListThreadMessagesNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'threadId',
        useInputToggleDataKey: 'useThreadIdInput',
        label: 'Thread ID',
        placeholder: 'Enter thread ID',
      },
      {
        type: 'number',
        dataKey: 'limit',
        useInputToggleDataKey: 'useLimitInput',
        label: 'Limit',
        defaultValue: 20,
        min: 1,
        max: 100,
      },
      {
        type: 'dropdown',
        dataKey: 'order',
        useInputToggleDataKey: 'useOrderInput',
        label: 'Order',
        options: [
          { value: 'asc', label: 'Ascending' },
          { value: 'desc', label: 'Descending' },
        ],
        defaultValue: 'asc',
      },
      {
        type: 'string',
        dataKey: 'after',
        useInputToggleDataKey: 'useAfterInput',
        label: 'After',
        placeholder: 'Enter after cursor',
      },
      {
        type: 'string',
        dataKey: 'before',
        useInputToggleDataKey: 'useBeforeInput',
        label: 'Before',
        placeholder: 'Enter before cursor',
      },
    ];
  },

  getBody(data) {
    return dedent`
      Thread ID: ${data.useThreadIdInput ? '(Thread ID From Input)' : data.threadId}
      Limit: ${data.useLimitInput ? '(Limit From Input)' : data.limit}, ${
      data.useOrderInput ? '(Order From Input)' : data.order === 'asc' ? 'Ascending' : 'Descending'
    }
${
  data.useAfterInput || data.after?.trim() ? `After: ${data.useAfterInput ? '(After From Input)' : data.after}\n` : ''
}${
      data.useBeforeInput || data.before?.trim()
        ? `Before: ${data.useBeforeInput ? '(Before From Input)' : data.before}\n`
        : ''
    }
    `;
  },

  async process(data, inputData, context) {
    const threadId = getInputOrData(data, inputData, 'threadId');
    const requestQuery: ListThreadMessagesQuery = {
      limit: getInputOrData(data, inputData, 'limit', 'number'),
      order: getInputOrData(data, inputData, 'order'),
      after: getInputOrData(data, inputData, 'after') || undefined, // Mutually exclusive with before, so set to undefined if empty string
      before: getInputOrData(data, inputData, 'before') || undefined,
    };

    const queryParams = Object.entries(requestQuery).filter(([, value]) => value !== undefined) as string[][];

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const query = new URLSearchParams(queryParams);
    const url = `https://api.openai.com/v1/threads/${threadId}/messages?${query.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
    });

    await handleOpenAIError(response);

    const body = (await response.json()) as OpenAIListResponse<OpenAIThreadMessage>;

    return {
      ['messages' as PortId]: {
        type: 'object[]',
        value: body.data,
      },
      ['first_id' as PortId]: {
        type: 'string',
        value: body.first_id,
      },
      ['last_id' as PortId]: {
        type: 'string',
        value: body.last_id,
      },
      ['has_more' as PortId]: {
        type: 'boolean',
        value: body.has_more,
      },
    };
  },
};

export const listThreadMessagesNode = pluginNodeDefinition(ListThreadMessagesNodeImpl, 'List Thread Messages');
