import { Pipeline, StepRun, init, runTest, getPipelines } from '@gentrace/core';

import {
  ExecutionRecorder,
  GraphId,
  GraphProcessor,
  NativeApi,
  Project,
  Recording,
  RivetPlugin,
  SecretPluginConfigurationSpec,
  Settings,
} from '../../index.js';

const apiKeyConfigSpec: SecretPluginConfigurationSpec = {
  type: 'secret',
  label: 'Gentrace API Key',
  description: 'The API key for the Gentrace service.',
  pullEnvironmentVariable: 'GENTRACE_API_KEY',
  helperText: 'Create at https://gentrace.ai/settings/api-keys',
};

function initializeGentrace(gentraceApiKey: string) {
  init({
    apiKey: gentraceApiKey,
    // TODO: remov
    basePath: 'http://localhost:3000/api/v1',
  });
}

export const runGentraceTests = async (
  gentracePipelineSlug: string,
  settings: Settings,
  project: Omit<Project, 'data'>,
  graphId: GraphId,
  nativeApi: NativeApi,
) => {
  const gentraceApiKey = settings.pluginSettings?.gentrace?.gentraceApiKey as string | undefined;

  if (!gentraceApiKey) {
    throw new Error('Gentrace API key not set.');
  }

  initializeGentrace(gentraceApiKey);

  const response = await runTest(gentracePipelineSlug, async (testCase) => {
    const pipeline = new Pipeline({
      slug: gentracePipelineSlug,
    });

    const runner = pipeline.start();

    // Transform inputs
    const rivetFormattedInputs: Record<string, any> = {};

    Object.entries(testCase.inputs).forEach(([key, value]) => {
      rivetFormattedInputs[key] = {
        // TODO: this is too naïve
        type: typeof value,
        value,
      };
    });

    const recorder = new ExecutionRecorder();
    const processor = new GraphProcessor(project, graphId);

    recorder.record(processor);
    await processor.processGraph(
      {
        settings,
        nativeApi,
      },
      rivetFormattedInputs,
    );

    const fullRecording = recorder.getRecording();

    const stepRuns = convertRecordingToStepRuns(fullRecording, project, graphId);

    stepRuns.forEach((stepRun) => {
      runner.addStepRunNode(stepRun);
    });

    return ['', runner];
  });

  return response;
};

type SimplifiedNode = {
  nodeId: string;
  start: number;
  end: number;
  modelParams: Record<string, any>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
};

function convertRecordingToStepRuns(recording: Recording, project: Omit<Project, 'data'>, graphId: GraphId): StepRun[] {
  const partialProcessStartEndPairs: {
    [processId: string]: Partial<SimplifiedNode>;
  } = {};

  recording.events.forEach((event) => {
    const eventType = event?.type;

    if (!eventType) {
      return;
    }

    if (eventType === 'nodeStart' || eventType === 'nodeFinish') {
      const processId = event?.data?.processId;
      const nodeId = event?.data?.nodeId;

      if (!processId) {
        return;
      }

      let existingPair = partialProcessStartEndPairs[processId];

      if (!existingPair) {
        existingPair = {};
        partialProcessStartEndPairs[processId] = existingPair;
      }

      existingPair.nodeId = nodeId;

      if (eventType === 'nodeStart') {
        existingPair.start = event.ts;
        existingPair.inputs = event.data.inputs;
      } else {
        existingPair.end = event.ts;
        existingPair.outputs = event.data.outputs;
      }
    }
  });

  const processStartEndPairs = partialProcessStartEndPairs as {
    [processId: string]: SimplifiedNode;
  };

  const selectedGraph = project.graphs[graphId];

  if (!selectedGraph) {
    return [];
  }

  // Convert to step runs
  const stepRuns: StepRun[] = [];

  for (const [, pair] of Object.entries(processStartEndPairs)) {
    const { nodeId } = pair;

    const relatedNode = selectedGraph.nodes.find((node) => node.id === nodeId);

    const nodeType = relatedNode?.type;

    if (!nodeType || !relatedNode.data || nodeType === 'graphInput' || nodeType === 'graphOutput') {
      continue;
    }

    const nodeData = relatedNode.data as Record<string, any>;

    if (relatedNode) {
      pair.modelParams = { ...nodeData, ...{ type: nodeType } };
    }

    if (nodeType === 'chat') {
      const modelName = nodeData.model ? nodeData.model : '';

      if (modelName.startsWith('gpt')) {
        // Convert to OpenAI Gentrace node
        const gentraceOpenAIInputs: Record<string, any> = { ...pair.inputs };

        gentraceOpenAIInputs.messages = [
          {
            content: pair.inputs.prompt.value,
            role: 'user',
          },
        ];

        const gentraceOpenAIModelParams: Record<string, any> = { ...pair.modelParams };

        gentraceOpenAIModelParams.model = modelName;

        gentraceOpenAIModelParams.frequency_penalty = pair.modelParams.frequencyPenalty || null;

        gentraceOpenAIModelParams.max_tokens = pair.modelParams.maxTokens || undefined;

        gentraceOpenAIModelParams.presence_penalty = pair.modelParams.presencePenalty || null;

        gentraceOpenAIModelParams.stop = pair.modelParams.stop || null;

        gentraceOpenAIModelParams.temperature = pair.modelParams.temperature || null;

        gentraceOpenAIModelParams.top_p = pair.modelParams.top_p || null;

        const gentraceOpenAIOutputs: Record<string, any> = { ...pair.outputs };

        const outputValues: string[] = Array.isArray(pair.outputs.response.value)
          ? pair.outputs.response.value
          : [pair.outputs.response.value];

        gentraceOpenAIOutputs.choices = outputValues.map((outputValue, index) => {
          return {
            index,
            message: {
              content: outputValue,
              role: 'assistant',
            },
            usage: {
              completion_tokens: pair.outputs.responseTokens.value,
              prompt_tokens: pair.outputs.requestTokens.value,
              total_tokens: pair.outputs.responseTokens.value + pair.outputs.requestTokens.value,
            },
          };
        });

        stepRuns.push(
          new StepRun(
            'openai',
            'openai_createChatCompletion',
            pair.end - pair.start,
            new Date(pair.start).toISOString(),
            new Date(pair.end).toISOString(),
            gentraceOpenAIInputs,
            gentraceOpenAIModelParams,
            gentraceOpenAIOutputs,
            {},
          ),
        );

        continue;
      }
    }

    stepRuns.push(
      new StepRun(
        'rivet',
        // TODO: append node type to this string
        'rivet_operation',
        pair.end - pair.start,
        new Date(pair.start).toISOString(),
        new Date(pair.end).toISOString(),
        pair.inputs,
        pair.modelParams,
        pair.outputs,
        {},
      ),
    );
  }

  return stepRuns;
}

export const getGentracePipelines = async (gentraceApiKey: string) => {
  initializeGentrace(gentraceApiKey);
  return await getPipelines();
};

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
