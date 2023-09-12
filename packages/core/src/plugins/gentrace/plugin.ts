import { Pipeline, getTestCases, init, runTest } from '@gentrace/core';
import { Project, RivetPlugin, SecretPluginConfigurationSpec } from '../../index.js';

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
  gentraceApiKey: string,
  project: Omit<Project, 'data'>,
  graphId: string,
) => {
  initializeGentrace(gentraceApiKey);
  await runTest(gentracePipelineSlug, async (testCase) => {
    console.log('testCase', testCase);
    const pipeline = new Pipeline({
      slug: gentracePipelineSlug,
    });

    const runner = pipeline.start();

    // TODO: run graph processor and recorder

    const result = await runner.measure(
      async (a, b) => {
        return a + b;
      },
      [1, 2],
      {
        modelParams: { b: 5 },
        invocation: 'customAddition',
      },
    );

    return [result, runner];
  });
};

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
