import { RivetPlugin } from '@ironclad/rivet-core';
import { chatAnthropicNode } from './nodes/ChatAnthropicNode.js';

export const anthropicPlugin: RivetPlugin = {
  id: 'anthropic',
  register: (register) => {
    register(chatAnthropicNode);
  },

  configSpec: {
    anthropicApiKey: {
      type: 'string',
      label: 'Anthropic API Key',
      description: 'The API key for the Anthropic service.',
      pullEnvironmentVariable: 'ANTHROPIC_API_KEY',
    },
  },
};
