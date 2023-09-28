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
      type: 'string',
      label: 'Anthropic API Key',
      description: 'The API key for the Anthropic service.',
      pullEnvironmentVariable: 'ANTHROPIC_API_KEY',
      helperText: 'You may also set the ANTHROPIC_API_KEY environment variable.',
    },
  },
};
