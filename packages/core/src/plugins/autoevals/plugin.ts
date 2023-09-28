import type { RivetPlugin } from '../../index.js';
import { autoEvalsNode } from './AutoEvalsNode.js';

export const autoevalsPlugin: RivetPlugin = {
  id: 'autoevals',
  name: 'Autoevals',
  register: (register) => {
    register(autoEvalsNode);
  },
};
