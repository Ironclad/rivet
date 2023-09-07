import { RivetPlugin } from '../../index.js';

export const braintrustPlugin: RivetPlugin = {
  id: 'braintrust',
  name: 'Braintrust',

  configSpec: {
    braintrustApiKey: {
      type: 'secret',
      label: 'Braintrust API Key',
      description: 'API key for Braintrust',
      pullEnvironmentVariable: 'BRAINTRUST_API_KEY',
      helperText: 'Alternatively, set the BRAINTRUST_API_KEY environment variable',
    },
  },
};
