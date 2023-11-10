import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
} from '../../../index.js';
import { newId, dedent, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type DeleteAssistantNode = ChartNode<'openaiDeleteAssistant', DeleteAssistantNodeData>;

export type DeleteAssistantNodeData = {
  assistantId: string;
  useAssistantIdInput?: boolean;
};

export const DeleteAssistantNodeImpl: PluginNodeImpl<DeleteAssistantNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiDeleteAssistant',
      data: {
        assistantId: '',
        useAssistantIdInput: true,
      },
      title: 'Delete Assistant',
      visualData: {
        x: 0,
        y: 0,
        width: 275,
      },
    };
  },

  getUIData() {
    return {
      group: 'OpenAI',
      contextMenuTitle: 'Delete Assistant',
      infoBoxTitle: 'Delete Assistant Node',
      infoBoxBody: 'Delete an existing assistant from OpenAI.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useAssistantIdInput) {
      inputs.push({
        id: 'assistantId' as PortId,
        dataType: 'string',
        title: 'Assistant ID',
        description: 'The ID of the assistant to delete.',
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
        description: 'The ID of the deleted assistant.',
      },
    ];
  },

  getBody(data) {
    return dedent`
      ${data.useAssistantIdInput ? '' : `Assistant ID: ${data.assistantId}`}
    `;
  },

  getEditors() {
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

  async process(data, inputData, context) {
    const assistantId = getInputOrData(data, inputData, 'assistantId');

    if (!assistantId) {
      throw new Error('Assistant ID is required.');
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'DELETE',
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
      };
    }

    await handleOpenAIError(response);

    // Return the assistantId as output so that subsequent nodes can use it
    return {
      ['assistantId' as PortId]: {
        type: 'string',
        value: assistantId,
      },
    };
  },
};

export const deleteAssistantNode = pluginNodeDefinition(DeleteAssistantNodeImpl, 'Delete Assistant');
