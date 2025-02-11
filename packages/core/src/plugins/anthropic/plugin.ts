import { type RivetPlugin } from '../../index.js';
import { chatAnthropicNode } from './nodes/ChatAnthropicNode.js';

export const anthropicPlugin: RivetPlugin = {
  id: 'anthropic',
  name: 'Anthropic',

  register: (register) => {
    register(chatAnthropicNode);
  },

  configSpec: {
    anthropicApiKey: {
      type: 'secret',
      label: 'Anthropic API Key',
      description: 'The API key for the Anthropic service.',
      pullEnvironmentVariable: 'ANTHROPIC_API_KEY',
      helperText: 'You may also set the ANTHROPIC_API_KEY environment variable.',
    },
    anthropicApiEndpoint: {
      type: 'string',
      label: 'Anthropic API Endpoint',
      description: 'The API endpoint for the Anthropic service.',
      pullEnvironmentVariable: 'ANTHROPIC_API_ENDPOINT',
      helperText:
        'Defaults to https://api.anthropic.com/v1. You may also set the ANTHROPIC_API_ENDPOINT environment variable.',
      default: 'https://api.anthropic.com/v1',
    },
  },
};
