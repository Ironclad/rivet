import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
} from '../../../index.js';
import type { OpenAIThread } from '../../../utils/openai.js';
import { newId, dedent } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';

export type GetThreadNode = ChartNode<'openaiGetThread', GetThreadNodeData>;

export type GetThreadNodeData = {
  threadId: string;
  useThreadIdInput?: boolean;
};

export const GetThreadNodeImpl: PluginNodeImpl<GetThreadNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiGetThread',
      data: {
        threadId: '',
        useThreadIdInput: true,
      },
      title: 'Get Thread',
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
      contextMenuTitle: 'Get Thread',
      infoBoxTitle: 'Get Thread Node',
      infoBoxBody: 'Retrieve an existing thread from OpenAI assistants.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (data.useThreadIdInput) {
      inputs.push({
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        description: 'The ID of the thread to retrieve.',
        required: true,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'thread' as PortId,
        dataType: 'object',
        title: 'Thread',
        description:
          'The retrieved thread object. If the thread does not exist, this port will not be ran. You can use an If node to test whether the thread exists.',
      },
    ];
  },

  getEditors(): EditorDefinition<GetThreadNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'threadId',
        useInputToggleDataKey: 'useThreadIdInput',
        label: 'Thread ID',
        autoFocus: true,
      },
    ];
  },

  getBody(data) {
    return dedent`
      ${data.useThreadIdInput ? '(Thread ID from input)' : `Thread ID: ${data.threadId}`}
    `;
  },

  async process(data, inputData, context) {
    let threadId = data.threadId;

    if (data.useThreadIdInput) {
      threadId = inputData['threadId' as PortId]?.value as string;
      if (!threadId) {
        throw new Error('Thread ID is required.');
      }
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
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
        ['thread' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    if (!response.ok) {
      throw new Error('Failed to get thread.');
    }

    const body = (await response.json()) as OpenAIThread;

    return {
      ['thread' as PortId]: {
        type: 'object',
        value: body,
      },
    };
  },
};

export const getThreadNode = pluginNodeDefinition(GetThreadNodeImpl, 'Get Thread');
