import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
  type GptFunction,
} from '../../../index.js';
import { openAiModelOptions, type CreateAssistantBody, type OpenAIAssistantTool } from '../../../utils/openai.js';
import { dedent, newId, coerceTypeOptional, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';

export type CreateAssistantNode = ChartNode<'openaiCreateAssistant', CreateAssistantNodeData>;

export type CreateAssistantNodeData = {
  assistantId: string;
  useAssistantIdInput?: boolean;

  model?: string;
  useModelInput?: boolean;

  name?: string;
  useNameInput?: boolean;

  description?: string;
  useDescriptionInput?: boolean;

  instructions?: string;
  useInstructionsInput?: boolean;

  useCodeInterpreterTool?: boolean;
  useRetrievalTool?: boolean;
  functions?: GptFunction[];

  file_ids?: string[];
  useFileIdsInput?: boolean;

  metadata: { key: string; value: string }[];
  useMetadataInput?: boolean;
};

export const CreateAssistantNodeImpl: PluginNodeImpl<CreateAssistantNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiCreateAssistant',
      data: {
        assistantId: '',
        useAssistantIdInput: false,
        model: '',
        useModelInput: false,
        name: '',
        useNameInput: false,
        description: '',
        useDescriptionInput: false,
        instructions: '',
        useInstructionsInput: false,
        tools: [],
        file_ids: [],
        useFileIdsInput: false,
        metadata: [],
        useMetadataInput: false,
      },
      title: 'Create Assistant',
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
      contextMenuTitle: 'Create Assistant',
      infoBoxTitle: 'Create Assistant Node',
      infoBoxBody: 'Create a new assistant for OpenAI.',
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
        description: 'The ID of the assistant to modify. Leave empty to create a new assistant.',
      });
    }

    if (data.useModelInput) {
      inputs.push({
        id: 'model' as PortId,
        dataType: 'string',
        title: 'Model',
        coerced: true,
        defaultValue: '',
        description: 'ID of the model to use.',
        required: false,
      });
    }

    if (data.useNameInput) {
      inputs.push({
        id: 'name' as PortId,
        dataType: 'string',
        title: 'Name',
        coerced: true,
        defaultValue: '',
        description: 'The name of the assistant.',
        required: false,
      });
    }

    if (data.useDescriptionInput) {
      inputs.push({
        id: 'description' as PortId,
        dataType: 'string',
        title: 'Description',
        coerced: true,
        defaultValue: '',
        description: 'The description of the assistant.',
        required: false,
      });
    }

    if (data.useInstructionsInput) {
      inputs.push({
        id: 'instructions' as PortId,
        dataType: 'string',
        title: 'Instructions',
        coerced: true,
        defaultValue: '',
        description: 'The system instructions that the assistant uses.',
        required: false,
      });
    }

    inputs.push({
      id: 'functions' as PortId,
      dataType: 'object[]',
      title: 'Functions',
      coerced: true,
      defaultValue: [],
      description: 'A list of GPT functions enabled on the assistant.',
      required: false,
    });

    if (data.useFileIdsInput) {
      inputs.push({
        id: 'file_ids' as PortId,
        dataType: 'string[]',
        title: 'File IDs',
        coerced: true,
        defaultValue: [],
        description: 'A list of file IDs attached to this assistant.',
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
        description: 'Metadata to attach to the assistant.',
        required: false,
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
        description: 'The ID of the created assistant.',
      },
      {
        id: 'assistant' as PortId,
        dataType: 'object',
        title: 'Assistant',
        description: 'The full created assistant object.',
      },
    ];
  },

  getEditors(): EditorDefinition<CreateAssistantNode>[] {
    return [
      {
        type: 'string',
        dataKey: 'assistantId',
        useInputToggleDataKey: 'useAssistantIdInput',
        label: 'Existing Assistant ID',
        placeholder: 'Existing assistant ID',
        helperMessage: 'Leave empty to create a new assistant.',
      },
      {
        type: 'dropdown',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        label: 'Model',
        options: openAiModelOptions,
        defaultValue: 'gpt-4-1106-preview',
      },
      {
        type: 'string',
        dataKey: 'name',
        useInputToggleDataKey: 'useNameInput',
        label: 'Name',
        placeholder: 'Enter assistant name',
        maxLength: 256,
        autoFocus: true,
      },
      {
        type: 'string',
        dataKey: 'description',
        useInputToggleDataKey: 'useDescriptionInput',
        label: 'Description',
        placeholder: 'Enter assistant description',
        maxLength: 512,
      },
      {
        type: 'code',
        dataKey: 'instructions',
        useInputToggleDataKey: 'useInstructionsInput',
        label: 'Instructions',
        language: 'markdown',
      },
      {
        type: 'toggle',
        dataKey: 'useCodeInterpreterTool',
        label: 'Code Interpreter Tool Enabled',
      },
      {
        type: 'toggle',
        dataKey: 'useRetrievalTool',
        label: 'Retrieval Tool Enabled',
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
      Model: ${data.useModelInput ? '(Model From Input)' : data.model}
      Name: ${data.useNameInput ? '(Name From Input)' : data.name}
      Description: ${data.useDescriptionInput ? '(Description From Input)' : data.description}
      File IDs: ${data.useFileIdsInput ? '(File IDs From Input)' : JSON.stringify(data.file_ids)}
      Metadata: ${
        data.useMetadataInput
          ? '(Metadata From Input)'
          : data.metadata.map(({ key, value }) => `${key}=${value}`).join(', ')
      }

      ${data.useInstructionsInput ? '(Instructions From Input)' : data.instructions}
    `;
  },

  async process(data, inputData, context) {
    const assistantId = getInputOrData(data, inputData, 'assistantId');

    let metadata = data.metadata.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    if (data.useMetadataInput && inputData['metadata' as PortId]) {
      metadata = coerceTypeOptional(inputData['metadata' as PortId], 'object') as Record<string, string>;
    }

    const functionTools = coerceTypeOptional(inputData['functions' as PortId], 'gpt-function[]');
    const tools = [...(functionTools?.map((f): OpenAIAssistantTool => ({ type: 'function', function: f })) ?? [])];
    if (data.useCodeInterpreterTool) {
      tools.push({ type: 'code_interpreter' });
    }
    if (data.useRetrievalTool) {
      tools.push({ type: 'retrieval' });
    }

    const requestBody: CreateAssistantBody = {
      model: getInputOrData(data, inputData, 'model'),
      name: getInputOrData(data, inputData, 'name'),
      description: getInputOrData(data, inputData, 'description'),
      instructions: getInputOrData(data, inputData, 'instructions'),
      tools,
      file_ids: getInputOrData(data, inputData, 'file_ids', 'string[]'),
      metadata,
    };

    if (!requestBody.model?.trim() || !requestBody.name?.trim()) {
      throw new Error('Model and name are required.');
    }

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    const url = assistantId.trim()
      ? `https://api.openai.com/v1/assistants/${assistantId}`
      : 'https://api.openai.com/v1/assistants';

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

export const createAssistantNode = pluginNodeDefinition(CreateAssistantNodeImpl, 'Create Assistant');
