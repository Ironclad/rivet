import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
} from '../../../index.js';
import { newId, dedent, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';

export type DeleteThreadNode = ChartNode<'openaiDeleteThread', DeleteThreadNodeData>;

export type DeleteThreadNodeData = {
  threadId: string;
  useThreadIdInput?: boolean;
};

export const DeleteThreadNodeImpl: PluginNodeImpl<DeleteThreadNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiDeleteThread',
      data: {
        threadId: '',
        useThreadIdInput: true,
      },
      title: 'Delete Thread',
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
      contextMenuTitle: 'Delete Thread',
      infoBoxTitle: 'Delete Thread Node',
      infoBoxBody: 'Delete an existing thread from OpenAI assistants.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useThreadIdInput) {
      inputs.push({
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        description: 'The ID of the thread to delete.',
        required: true,
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
        description: 'The ID of the deleted thread.',
      },
    ];
  },

  getBody(data) {
    return dedent`
      ${data.useThreadIdInput ? '' : `Thread ID: ${data.threadId}`}
    `;
  },

  getEditors() {
    return [];
  },

  async process(data, inputData, context) {
    const threadId = getInputOrData(data, inputData, 'threadId');

    if (!threadId) {
      throw new Error('Thread ID is required.');
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
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
        ['threadId' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    if (!response.ok) {
      throw new Error('Failed to delete thread.');
    }

    // Return the threadId as output so that subsequent nodes can use it
    return {
      ['threadId' as PortId]: {
        type: 'string',
        value: threadId,
      },
    };
  },
};

export const deleteThreadNode = pluginNodeDefinition(DeleteThreadNodeImpl, 'Delete Thread');
