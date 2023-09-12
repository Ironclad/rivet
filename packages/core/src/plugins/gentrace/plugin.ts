import { RivetPlugin, SecretPluginConfigurationSpec } from '../../index.js';

const apiKeyConfigSpec: SecretPluginConfigurationSpec = {
  type: 'secret',
  label: 'Gentrace API Key',
  description: 'The API key for the Gentrace service.',
  pullEnvironmentVariable: 'GENTRACE_API_KEY',
  helperText: 'You may also set the GENTRACE_API_KEY environment variable.',
};

export const gentracePlugin: RivetPlugin = {
  id: 'gentrace',
  name: 'Gentrace',

  configSpec: {
    gentraceApiKey: apiKeyConfigSpec,
  },
};
