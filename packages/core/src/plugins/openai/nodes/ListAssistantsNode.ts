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
import type { OpenAIAssistant, OpenAIListResponse, OpenAIPaginationQuery } from '../../../utils/openai.js';

export type ListAssistantsNode = ChartNode<'openaiListAssistants', ListAssistantsNodeData>;

export type ListAssistantsNodeData = {
  limit?: number;
  useLimitInput?: boolean;

  order?: string;
  useOrderInput?: boolean;

  after?: string;
  useAfterInput?: boolean;

  before?: string;
  useBeforeInput?: boolean;
};

export const ListAssistantsNodeImpl: PluginNodeImpl<ListAssistantsNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiListAssistants',
      data: {
        limit: 20,
        useLimitInput: false,
        order: 'asc',
        useOrderInput: false,
        after: '',
        useAfterInput: false,
        before: '',
        useBeforeInput: false,
      },
      title: 'List Assistants',
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
      contextMenuTitle: 'List Assistants',
      infoBoxTitle: 'List Assistants Node',
      infoBoxBody: 'List assistants from OpenAI.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

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
        id: 'assistants' as PortId,
        dataType: 'object[]',
        title: 'Assistants',
        description: 'The list of assistants.',
      },
      {
        id: 'first_id' as PortId,
        dataType: 'string',
        title: 'First ID',
        description: 'The ID of the first assistant in the list.',
      },
      {
        id: 'last_id' as PortId,
        dataType: 'string',
        title: 'Last ID',
        description: 'The ID of the last assistant in the list.',
      },
      {
        id: 'has_more' as PortId,
        dataType: 'boolean',
        title: 'Has More',
        description: 'Whether there are more assistants to be retrieved.',
      },
    ];
  },

  getEditors(): EditorDefinition<ListAssistantsNode>[] {
    return [
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
    const requestQuery: OpenAIPaginationQuery = {
      limit: getInputOrData(data, inputData, 'limit', 'number').toString(),
      order: getInputOrData(data, inputData, 'order'),
      after: getInputOrData(data, inputData, 'after') || undefined, // Mutually exclusive with before, so set to undefined if empty string
      before: getInputOrData(data, inputData, 'before') || undefined,
    };

    const queryParams = Object.entries(requestQuery).filter(([, value]) => value !== undefined) as string[][];

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const query = new URLSearchParams(queryParams);
    const url = `https://api.openai.com/v1/assistants?${query.toString()}`;

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

    const body = (await response.json()) as OpenAIListResponse<OpenAIAssistant>;

    return {
      ['assistants' as PortId]: {
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

export const listAssistantsNode = pluginNodeDefinition(ListAssistantsNodeImpl, 'List Assistants');
