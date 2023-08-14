import { RivetPlugin } from '../../index.js';
import { leMURNode } from './LeMURNode.js';

export const assemblyAiPlugin: RivetPlugin = {
  id: 'assemblyAi',
  register: (registry) => {
    registry.register(leMURNode);
  },
};
