import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
  type PluginNodeImpl,
} from '../../../index.js';
import { dedent, newId, coerceTypeOptional, getInputOrData, coerceType } from '../../../utils/index.js';
import { interpolate } from '../../../utils/interpolation.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import type { CreateMessageBody, OpenAIThreadMessage } from '../../../utils/openai.js';
import { mapValues } from 'lodash-es';

export type ThreadMessageNode = ChartNode<'threadMessage', ThreadMessageNodeData>;

export type ThreadMessageNodeData = {
  text: string;

  fileIds?: string[];
  useFileIdsInput?: boolean;

  metadata: { key: string; value: string }[];
  useMetadataInput?: boolean;
};

export const ThreadMessageNodeImpl: PluginNodeImpl<ThreadMessageNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'threadMessage',
      data: {
        text: '{{input}}',
        fileIds: [],
        useFileIdsInput: false,
        metadata: [],
        useMetadataInput: false,
      },
      title: 'Thread Message',
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
      contextMenuTitle: 'Thread Message',
      infoBoxTitle: 'Thread Message Node',
      infoBoxBody: 'Create a new message for a thread.',
    };
  },

  getInputDefinitions(data) {
    let inputs: NodeInputDefinition[] = [];

    if (data.useFileIdsInput) {
      inputs.push({
        id: 'fileIds' as PortId,
        dataType: 'string[]',
        title: 'File IDs',
        coerced: true,
        defaultValue: [],
        description: 'The IDs of the files to attach to the message.',
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

    // Extract inputs from promptText, everything like {{input}}
    const inputNames = [...new Set(data.text.match(/\{\{([^}]+)\}\}/g))];
    inputs = [
      ...inputs,
      ...(inputNames?.map((inputName): NodeInputDefinition => {
        return {
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2) as PortId,
          title: inputName.slice(2, -2),
          dataType: 'string',
          required: false,
        };
      }) ?? []),
    ];

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'message' as PortId,
        dataType: 'object',
        title: 'Message',
        description: 'The created message.',
      },
    ];
  },

  getEditors(): EditorDefinition<ThreadMessageNode>[] {
    return [
      {
        type: 'code',
        label: 'Text',
        dataKey: 'text',
        language: 'prompt-interpolation-markdown',
        theme: 'prompt-interpolation',
      },
      {
        type: 'keyValuePair',
        dataKey: 'metadata',
        useInputToggleDataKey: 'useMetadataInput',
        label: 'Metadata',
        keyPlaceholder: 'Key',
        valuePlaceholder: 'Value',
      },
      {
        type: 'stringList',
        dataKey: 'fileIds',
        useInputToggleDataKey: 'useFileIdsInput',
        label: 'File IDs',
        placeholder: 'File ID',
      },
    ];
  },

  getBody(data) {
    return {
      type: 'colorized',
      text: data.text.split('\n').slice(0, 15).join('\n').trim(),
      language: 'prompt-interpolation-markdown',
      theme: 'prompt-interpolation',
    };
  },

  async process(data, inputData) {
    const text = getInputOrData(data, inputData, 'text', 'string');
    const fileIds = getInputOrData(data, inputData, 'fileIds', 'string[]') ?? [];

    let metadata: Record<string, string> = data.metadata.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (data.useMetadataInput && inputData['metadata' as PortId]) {
      metadata = coerceTypeOptional(inputData['metadata' as PortId], 'object') as Record<string, string>;
    }

    const inputMap = mapValues(inputData, (input) => coerceType(input, 'string')) as Record<PortId, string>;
    const interpolated = interpolate(text, inputMap);

    // Here you would typically make a call to an API to create the message
    // For the sake of this example, we'll just return the data as is

    return {
      ['message' as PortId]: {
        type: 'object',
        value: {
          role: 'user',
          content: interpolated,
          file_ids: fileIds,
          metadata,
        } satisfies CreateMessageBody,
      },
    };
  },
};

export const threadMessageNode = pluginNodeDefinition(ThreadMessageNodeImpl, 'Thread Message');
