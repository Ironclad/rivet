import { RivetPlugin } from '@ironclad/rivet-core';
import { chatAnthropicNode } from './nodes/ChatAnthropicNode.js';

export const anthropicPlugin: RivetPlugin = {
  id: 'anthropic',
  register: (registry) => {
    registry.register(chatAnthropicNode);
  },
};
