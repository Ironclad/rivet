import { RivetPlugin } from '../../index.js';
import { autoEvalsNode } from './AutoEvalsNode.js';

export const autoevalsPlugin: RivetPlugin = {
  id: 'autoevals',
  register: (registry) => {
    registry.register(autoEvalsNode);
  },
};
