import { Pipeline, StepRun, init, runTest } from '@gentrace/core';
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

  await runTest(gentracePipelineSlug, async (testCase) => {
    const pipeline = new Pipeline({
      slug: gentracePipelineSlug,
    });

    const runner = pipeline.start();

    console.log('project', project, testCase.inputs);

    // Transform inputs
    const rivetFormattedInputs: Record<string, any> = {};

    Object.entries(testCase.inputs).forEach(([key, value]) => {
      rivetFormattedInputs[key] = {
        // TODO: this is too naïve
        type: typeof value,
        value,
      };
    });

    console.log('rivetFormattedInputs', rivetFormattedInputs);

    const recorder = new ExecutionRecorder();
    const processor = new GraphProcessor(project, graphId);

    recorder.record(processor);
    const outputs = await processor.processGraph(
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

  for (const [, pair] of Object.entries(processStartEndPairs)) {
    const { nodeId } = pair;

    const relatedNode = selectedGraph.nodes.find((node) => node.id === nodeId);

    if (relatedNode) {
      pair.modelParams = relatedNode.data as Record<string, any>;
    }
  }

  // Convert to step runs
  const stepRuns: StepRun[] = [];

  return stepRuns;
}

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
