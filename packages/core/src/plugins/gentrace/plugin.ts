import { Pipeline, init, runTest } from '@gentrace/core';
import {
  ExecutionRecorder,
  GraphId,
  GraphProcessor,
  NativeApi,
  Project,
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
  graphId: string,
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
    const processor = new GraphProcessor(project, graphId as GraphId);

    recorder.record(processor);
    const outputs = await processor.processGraph(
      {
        settings,
        nativeApi,
      },
      rivetFormattedInputs,
    );

    const fullRecording = recorder.getRecording();

    console.log('fullRecording', fullRecording);

    // Get start and end nodes

    return ['', runner];
  });
};

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
