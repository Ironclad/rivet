import {
  type ChartNode,
  type PluginNodeImpl,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type EditorDefinition,
  type GptFunction,
  type GraphId,
  type GraphInputs,
  type ScalarDataValue,
  isArrayDataValue,
  arrayizeDataValue,
  unwrapDataValue,
} from '../../../index.js';
import {
  openAiModelOptions,
  type CreateRunBody,
  type OpenAIAssistantTool,
  type OpenAIRun,
  type CreateMessageBody,
  type OpenAIRunStep,
  type OpenAIListResponse,
  type OpenAIPaginationQuery,
  type OpenAIThreadMessage,
} from '../../../utils/openai.js';
import { dedent, newId, coerceTypeOptional, getInputOrData } from '../../../utils/index.js';
import { pluginNodeDefinition } from '../../../model/NodeDefinition.js';
import { handleOpenAIError } from '../handleOpenaiError.js';
import { type DataValue } from '../../../model/DataValue.js';
import { match } from 'ts-pattern';

export type RunThreadNode = ChartNode<'openaiRunThread', RunThreadNodeData>;

export type RunThreadNodeData = {
  createThread: boolean;

  threadId: string;
  useThreadIdInput?: boolean;

  assistantId: string;
  useAssistantIdInput?: boolean;

  model?: string;
  useModelInput?: boolean;

  instructions?: string;
  useInstructionsInput?: boolean;

  useCodeInterpreterTool?: boolean;
  useRetrievalTool?: boolean;
  functions?: GptFunction[];

  metadata: { key: string; value: string }[];
  useMetadataInput?: boolean;

  toolCallHandlers: { key: string; value: GraphId }[];

  onMessageCreationSubgraphId?: GraphId;
};

const POLL_FREQUENCY = 500;

export const RunThreadNodeImpl: PluginNodeImpl<RunThreadNode> = {
  create() {
    return {
      id: newId<NodeId>(),
      type: 'openaiRunThread',
      data: {
        createThread: true,
        threadId: '',
        useThreadIdInput: false,
        assistantId: '',
        useAssistantIdInput: false,
        model: '',
        useModelInput: false,
        instructions: '',
        useInstructionsInput: false,
        tools: [],
        metadata: [],
        useMetadataInput: false,
        toolCallHandlers: [],
      },
      title: 'Run Thread',
      visualData: {
        x: 0,
        y: 0,
        width: 400,
      },
    };
  },

  getUIData() {
    return {
      group: 'OpenAI',
      contextMenuTitle: 'Run Thread',
      infoBoxTitle: 'Run Thread Node',
      infoBoxBody: 'Run a thread for OpenAI.',
    };
  },

  getInputDefinitions(data) {
    const inputs: NodeInputDefinition[] = [];

    if (!data.createThread && data.useThreadIdInput) {
      inputs.push({
        id: 'threadId' as PortId,
        dataType: 'string',
        title: 'Thread ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the thread to run.',
        required: true,
      });
    }

    if (data.createThread) {
      inputs.push({
        id: 'messages' as PortId,
        dataType: 'object[]',
        title: 'Messages',
        coerced: true,
        defaultValue: [],
        description: 'A list of user messages to start the thread with.',
        required: false,
      });
    }

    if (data.useAssistantIdInput) {
      inputs.push({
        id: 'assistantId' as PortId,
        dataType: 'string',
        title: 'Assistant ID',
        coerced: true,
        defaultValue: '',
        description: 'The ID of the assistant to use.',
        required: true,
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
      dataType: ['gpt-function[]', 'gpt-function'],
      title: 'Functions',
      coerced: true,
      defaultValue: [],
      description: 'A list of GPT functions enabled on the assistant.',
      required: false,
    });

    if (data.useMetadataInput) {
      inputs.push({
        id: 'metadata' as PortId,
        dataType: 'object',
        title: 'Metadata',
        coerced: true,
        defaultValue: {},
        description: 'Metadata to attach to the run.',
        required: false,
      });
    }

    return inputs;
  },

  getOutputDefinitions() {
    return [
      {
        id: 'runId' as PortId,
        dataType: 'string',
        title: 'Run ID',
        description: 'The ID of the run.',
      },
      {
        id: 'run' as PortId,
        dataType: 'object',
        title: 'Run',
        description: 'The full run object.',
      },
      {
        id: 'steps' as PortId,
        dataType: 'object[]',
        title: 'Steps',
        description: 'The list of steps for the run.',
      },
      {
        id: 'last_step' as PortId,
        dataType: 'object',
        title: 'Last Step',
        description: 'The last step for the run.',
      },
      {
        id: 'messages' as PortId,
        dataType: 'object[]',
        title: 'Messages',
        description: 'The list of messages for the thread.',
      },
      {
        id: 'last_message' as PortId,
        dataType: 'object',
        title: 'Last Message',
        description: 'The last message on the thread.',
      },
      {
        id: 'last_assistant_messages' as PortId,
        dataType: 'object[]',
        title: 'Last Assistant Messages',
        description: 'The last messages of type `assistant` for the thread.',
      },
    ];
  },

  getEditors(): EditorDefinition<RunThreadNode>[] {
    return [
      {
        type: 'toggle',
        dataKey: 'createThread',
        label: 'Create New Thread',
      },
      {
        type: 'string',
        dataKey: 'threadId',
        useInputToggleDataKey: 'useThreadIdInput',
        label: 'Thread ID',
        placeholder: 'Enter thread ID',
        helperMessage: 'The ID of the thread to run.',
        hideIf: (data) => data.createThread,
      },
      {
        type: 'string',
        dataKey: 'assistantId',
        useInputToggleDataKey: 'useAssistantIdInput',
        label: 'Assistant ID',
        placeholder: 'Enter assistant ID',
        helperMessage: 'The ID of the assistant to use. Required.',
      },
      {
        type: 'dropdown',
        dataKey: 'model',
        useInputToggleDataKey: 'useModelInput',
        label: 'Model',
        options: [
          {
            label: 'Default',
            value: '',
          },
          ...openAiModelOptions,
        ],
        defaultValue: '',
        helperMessage: 'The GPT model to use for the run. If default, the model of the assistant will be used.',
      },
      {
        type: 'code',
        dataKey: 'instructions',
        useInputToggleDataKey: 'useInstructionsInput',
        label: 'Instructions',
        language: 'markdown',
        helperMessage:
          'The instructions for the assistant to use for the run. If empty, the instructions of the assistant will be used.',
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
        type: 'custom',
        customEditorId: 'ToolCallHandlers',
        label: 'Tool Call Handlers',
        dataKey: 'toolCallHandlers',
        helperMessage:
          'Handles for each function tool call that the assistant has access to. Make sure you provide a subgraph handler for every possible tool call that can be performed. A special `unknown` handler can be used as a fallback for unconfigured tool calls.',
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
        type: 'graphSelector',
        dataKey: 'onMessageCreationSubgraphId',
        label: 'On Message Creation Subgraph',
        helperMessage:
          'A subgraph to run when a message is created. The message will be available as `input` or `message` in the subgraph.',
      },
    ];
  },

  getBody(data, context) {
    let body = dedent`
      Assistant ID: ${data.useAssistantIdInput ? '(Assistant ID From Input)' : data.assistantId}
    `;

    const additional: string[] = [];

    if (data.createThread) {
      additional.push('Create New Thread');
    } else {
      additional.push(`Thread ID: ${data.useThreadIdInput ? '(Thread ID From Input)' : data.threadId}`);
    }

    if (data.useModelInput || data.model) {
      additional.push(`Model: ${data.useModelInput ? '(Model From Input)' : data.model}`);
    }

    if (data.useInstructionsInput || data.instructions?.trim()) {
      additional.push(`Instructions: ${data.useInstructionsInput ? '(Instructions From Input)' : data.instructions}`);
    }

    if (data.useMetadataInput || data.metadata.length > 0) {
      additional.push(
        `Metadata: ${
          data.useMetadataInput
            ? '(Metadata From Input)'
            : data.metadata.map(({ key, value }) => `${key}=${value}`).join(', ')
        }`,
      );
    }

    if (data.useCodeInterpreterTool) {
      additional.push('Code Interpreter Tool Enabled');
    }

    if (data.useRetrievalTool) {
      additional.push('Retrieval Tool Enabled');
    }

    if (data.toolCallHandlers.length > 0) {
      additional.push('Tool Call Handlers:');

      data.toolCallHandlers.forEach(({ key, value }) => {
        const subgraphName = context.project.graphs[value]?.metadata!.name! ?? 'Unknown Subgraph';
        additional.push(`    ${key || '(MISSING!)'} -> ${subgraphName}`);
      });
    }

    if (data.onMessageCreationSubgraphId) {
      const subgraphName =
        context.project.graphs[data.onMessageCreationSubgraphId]?.metadata!.name! ?? 'Unknown Subgraph';
      additional.push(`On Message Creation Subgraph: ${subgraphName}`);
    }

    body = `${body}\n${additional.join('\n')}`;

    return body;
  },

  async process(data, inputData, context) {
    const threadId = getInputOrData(data, inputData, 'threadId');
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

    const requestBody: CreateRunBody = {
      assistant_id: assistantId,
      model: getInputOrData(data, inputData, 'model'),
      instructions: getInputOrData(data, inputData, 'instructions'),
      tools,
      metadata,
    };

    if (!context.settings.openAiKey) {
      throw new Error('OpenAI key is not set.');
    }

    let response: Response;

    const coerceToThreadMessage = (value: DataValue | undefined): CreateMessageBody | undefined => {
      if (!value?.value) {
        return undefined;
      }

      if (value.type === 'string' || typeof value.value === 'string') {
        return { role: 'user', content: value.value as string };
      }

      if (typeof value.value === 'object') {
        if (!('role' in value.value)) {
          throw new Error('Invalid message format - missing role.');
        }

        if (value.value.role !== 'user') {
          throw new Error('Only user messages are supported.');
        }

        return value.value as CreateMessageBody;
      }

      return { role: 'user', content: coerceTypeOptional(value, 'string') ?? '' };
    };

    if (data.createThread) {
      const messagesInput = inputData['messages' as PortId];
      const messages = messagesInput
        ? arrayizeDataValue(unwrapDataValue(messagesInput)).map((message) => coerceToThreadMessage(message))
        : [];

      response = await fetch('https://api.openai.com/v1/threads/runs', {
        method: 'POST',
        headers: {
          'OpenAI-Beta': 'assistants=v1',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.settings.openAiKey}`,
          'OpenAI-Organization': context.settings.openAiOrganization ?? '',
        },
        body: JSON.stringify({
          ...requestBody,
          thread: {
            messages,
            // Thread metadata?
          },
        }),
      });
    } else {
      response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'OpenAI-Beta': 'assistants=v1',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.settings.openAiKey}`,
          'OpenAI-Organization': context.settings.openAiOrganization ?? '',
        },
        body: JSON.stringify(requestBody),
      });
    }

    await handleOpenAIError(response);

    const body = (await response.json()) as OpenAIRun;

    const pollController = new AbortController();
    const pollRunSteps = async (onNewStepCompleted: (step: OpenAIRunStep) => Promise<void>) => {
      let lastCompletedAt = 0;

      // On poll controller abort, continue so we get the final poll
      const pollControllerAborted = new Promise((resolve) =>
        pollController.signal.addEventListener('abort', () => resolve(undefined)),
      );

      // On main controller abort, reject
      const mainGraphAborted = new Promise((_, reject) =>
        context.signal.addEventListener('abort', () => reject(new Error('aborted'))),
      );

      while (!pollController.signal.aborted) {
        // Delay at beginning because there won't be anything to start, and also this helps last poll get final data
        await Promise.race([
          // Poll frequency
          new Promise((resolve) => setTimeout(resolve, POLL_FREQUENCY)),
          pollControllerAborted,
          mainGraphAborted,
        ]);

        const query = new URLSearchParams({
          limit: '3',
          order: 'desc',
        } satisfies OpenAIPaginationQuery);

        const url = `https://api.openai.com/v1/threads/${body.thread_id}/runs/${body.id}/steps?${query.toString()}`;
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

        const stepListBody = (await response.json()) as OpenAIListResponse<OpenAIRunStep>;

        const newSteps = stepListBody.data.filter(
          (step) => step.completed_at != null && step.completed_at > lastCompletedAt,
        );

        if (newSteps.length > 0) {
          lastCompletedAt = newSteps[0]!.completed_at!;
        }

        for (const newStep of newSteps) {
          await onNewStepCompleted(newStep);
        }
      }
    };

    const pollRunStepsPromise = data.onMessageCreationSubgraphId
      ? pollRunSteps(async (step) => {
          if (step.step_details.type !== 'message_creation') {
            return;
          }

          const messageId = step.step_details.message_creation.message_id;

          const messageResponse = await fetch(
            `https://api.openai.com/v1/threads/${body.thread_id}/messages/${messageId}`,
            {
              method: 'GET',
              headers: {
                'OpenAI-Beta': 'assistants=v1',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.openAiKey}`,
                'OpenAI-Organization': context.settings.openAiOrganization ?? '',
              },
            },
          );

          await handleOpenAIError(messageResponse);

          const messageBody = (await messageResponse.json()) as OpenAIThreadMessage;

          const inputs: GraphInputs = {
            input: {
              type: 'object[]',
              value: messageBody.content,
            },
            message: {
              type: 'object',
              value: messageBody,
            },
            message_id: {
              type: 'string',
              value: messageBody.id,
            },
            thread_id: {
              type: 'string',
              value: messageBody.thread_id,
            },
          };

          const subprocessor = context.createSubProcessor(data.onMessageCreationSubgraphId!, {
            signal: context.signal,
          });

          await subprocessor.processGraph(context, inputs, context.contextValues);
        })
      : Promise.resolve();

    try {
      let runStatus = body.status;

      while (runStatus === 'in_progress' || runStatus === 'queued') {
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${body.thread_id}/runs/${body.id}`, {
          method: 'GET',
          headers: {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.openAiKey}`,
            'OpenAI-Organization': context.settings.openAiOrganization ?? '',
          },
        });

        await handleOpenAIError(runResponse);

        const runBody = (await runResponse.json()) as OpenAIRun;
        runStatus = runBody.status;

        // Requires action, start calling subgraphs
        if (runStatus === 'requires_action') {
          const toolCalls = runBody.required_action!.submit_tool_outputs.tool_calls;

          /** Run one subgraph per tool call requested */
          const toolCallOutputs = await Promise.all(
            toolCalls.map(async (toolCall) => {
              let inputArguments: Record<string, any> = {};
              try {
                inputArguments = JSON.parse(toolCall.function.arguments);
              } catch (err) {
                // Ignore
              }

              const inputs: Record<string, DataValue> = {
                run_id: {
                  type: 'string',
                  value: runBody.id,
                },
                run: {
                  type: 'object',
                  value: runBody,
                },
                tool_call_id: {
                  type: 'string',
                  value: toolCall.id,
                },
                name: {
                  type: 'string',
                  value: toolCall.function.name,
                },
                arguments: {
                  type: 'object',
                  value: inputArguments,
                },
                input: {
                  type: 'object',
                  value: inputArguments,
                },
              };

              let handlerSubgraphId = data.toolCallHandlers.find(({ key }) => key === toolCall.function.name)?.value;

              // Fall back to "unknown" if it's present
              if (!handlerSubgraphId) {
                handlerSubgraphId = data.toolCallHandlers.find(({ key }) => key === 'unknown')?.value;
              }

              if (!handlerSubgraphId) {
                throw new Error(`No handler found for tool call: ${toolCall.function.name}`);
              }

              const subprocessor = context.createSubProcessor(handlerSubgraphId, { signal: context.signal });

              const outputs = await subprocessor.processGraph(context, inputs, context.contextValues);

              const outputString = coerceTypeOptional(outputs.output, 'string');

              return outputString ?? '';
            }),
          );

          /** Collect all the subgraph outputs, then submit them. All outputs must be submitted in a single request, per documentation. */
          const mappedToolCallOuptuts = toolCalls.map((toolCall, i) => ({
            tool_call_id: toolCall.id,
            output: toolCallOutputs[i],
          }));

          const submitResponse = await fetch(
            `https://api.openai.com/v1/threads/${body.thread_id}/runs/${body.id}/submit_tool_outputs`,
            {
              method: 'POST',
              headers: {
                'OpenAI-Beta': 'assistants=v1',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.openAiKey}`,
                'OpenAI-Organization': context.settings.openAiOrganization ?? '',
              },
              body: JSON.stringify({
                tool_outputs: mappedToolCallOuptuts,
              }),
            },
          );

          await handleOpenAIError(submitResponse);
        }

        await Promise.race([
          new Promise((resolve) => setTimeout(resolve, POLL_FREQUENCY)),
          new Promise((_, reject) => context.signal.addEventListener('abort', () => reject(new Error('aborted')))),
        ]);
      }

      if (
        runStatus === 'cancelled' ||
        runStatus === 'cancelling' ||
        runStatus === 'expired' ||
        runStatus === 'failed'
      ) {
        throw new Error(`Run failed with status: ${runStatus}`);
      }

      const listStepsQuery = new URLSearchParams({
        limit: '20',
        order: 'desc',
      });

      const listStepsResponsePromise = await fetch(
        `https://api.openai.com/v1/threads/${body.thread_id}/runs/${body.id}/steps?${listStepsQuery.toString()}`,
        {
          method: 'GET',
          headers: {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.openAiKey}`,
            'OpenAI-Organization': context.settings.openAiOrganization ?? '',
          },
        },
      );

      const getMessagesQuery = new URLSearchParams({
        limit: '20',
        order: 'desc',
      } satisfies OpenAIPaginationQuery);

      const messagesResponsePromise = await fetch(
        `https://api.openai.com/v1/threads/${body.thread_id}/messages?${getMessagesQuery.toString()}`,
        {
          method: 'GET',
          headers: {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.openAiKey}`,
            'OpenAI-Organization': context.settings.openAiOrganization ?? '',
          },
        },
      );

      const [listStepsResponse, messagesResponse] = await Promise.all([
        listStepsResponsePromise,
        messagesResponsePromise,
      ]);

      await handleOpenAIError(listStepsResponse);
      await handleOpenAIError(messagesResponse);

      const listStepsBody = (await listStepsResponse.json()) as OpenAIListResponse<OpenAIRunStep>;
      const messagesForThread = (await messagesResponse.json()) as OpenAIListResponse<OpenAIThreadMessage>;

      const lastUserMessageIndex = messagesForThread.data.findIndex((message) => message.role === 'user');
      const lastAssistantMessages = messagesForThread.data.slice(0, lastUserMessageIndex);

      return {
        ['runId' as PortId]: {
          type: 'string',
          value: body.id,
        },
        ['run' as PortId]: {
          type: 'object',
          value: body,
        },
        ['steps' as PortId]: {
          type: 'object[]',
          value: listStepsBody.data,
        },
        ['last_step' as PortId]: {
          type: 'object',
          value: listStepsBody.data[0]!,
        },
        ['messages' as PortId]: {
          type: 'object[]',
          value: messagesForThread.data,
        },
        ['last_message' as PortId]: {
          type: 'object',
          value: messagesForThread.data[0]!,
        },
        ['last_assistant_messages' as PortId]: {
          type: 'object[]',
          value: lastAssistantMessages,
        },
      };
    } finally {
      pollController.abort();
      await pollRunStepsPromise;
    }
  },
};

export const runThreadNode = pluginNodeDefinition(RunThreadNodeImpl, 'Run Thread');
