import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import { newId, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type GetAssistantNode = ChartNode<'openaiGetAssistant', GetAssistantNodeData>;

export type GetAssistantNodeData = {
  assistantId?: string;
  useAssistantIdInput?: boolean;
};

export const GetAssistantNodeImpl: PluginNodeImpl<GetAssistantNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiGetAssistant',
      data: {
        assistantId: '',
        useAssistantIdInput: true,
      },
      title: 'Get Assistant',
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
      contextMenuTitle: 'Get Assistant',
      infoBoxTitle: 'Get Assistant Node',
      infoBoxBody: 'Retrieve an assistant by its ID from OpenAI.',
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
        description: 'The ID of the assistant to retrieve.',
        required: true,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'assistantId' as PortId,
        dataType: 'string',
        title: 'Assistant ID',
        description: 'The ID of the retrieved assistant.',
      },
      {
        id: 'assistant' as PortId,
        dataType: 'object',
        title: 'Assistant',
        description: 'The full retrieved assistant object.',
      },
    ];
  },

  getEditors(): EditorDefinition<GetAssistantNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'assistantId',
        useInputToggleDataKey: 'useAssistantIdInput',
        label: 'Assistant ID',
        placeholder: 'Enter assistant ID',
      },
    ];
  },

  getBody(data) {
    return `Assistant ID: ${data.useAssistantIdInput ? '(Assistant ID From Input)' : data.assistantId}`;
  },

  async process(data, inputData, context) {
    const assistantId = getInputOrData(data, inputData, 'assistantId');

    if (!assistantId?.trim()) {
      throw new Error('Assistant ID is required.');
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'GET',
      headers: {
        'OpenAI-Beta': 'assistants=v1',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.settings.openAiKey}`,
        'OpenAI-Organization': context.settings.openAiOrganization ?? '',
      },
    });

    if (response.status === 404) {
      return {
        ['assistantId' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
        ['assistant' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    await handleOpenAIError(response);

    const body = await response.json();

    return {
      ['assistantId' as PortId]: {
        type: 'string',
        value: body.id,
      },
      ['assistant' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const getAssistantNode = pluginNodeDefinition(GetAssistantNodeImpl, 'Get Assistant');
