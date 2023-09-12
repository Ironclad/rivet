import { Project, RivetPlugin, SecretPluginConfigurationSpec, globalRivetNodeRegistry } from '../../index.js';
import { getTestCases, init } from '@gentrace/core';

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
  gentracePipelineId: string,
  gentraceApiKey: string,
  project: Omit<Project, 'data'>,
  graphId: string,
) => {
  initializeGentrace(gentraceApiKey);
  const cases = await getTestCases(gentracePipelineId);

  console.log('cases', cases, graphId, project);
};

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
