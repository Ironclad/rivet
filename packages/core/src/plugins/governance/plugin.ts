import { type RivetPlugin } from '../../index.js';
import { governancePIIScanNode } from './nodes/GovernanceNode.js';

export const governancePlugin: RivetPlugin = {
  id: 'governance',
  name: 'Governance',

  configSpec: {},

  contextMenuGroups: [
    {
      id: 'governance',
      label: 'Governance',
    },
  ],

  register(register) {
    register(governancePIIScanNode);
  },
};
