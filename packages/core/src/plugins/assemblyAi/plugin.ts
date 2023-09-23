import { type RivetPlugin } from '../../index.js';
import { lemurQaNode } from './LemurQaNode.js';
import { transcribeAudioNode } from './TranscribeAudioNode.js';
import { lemurSummaryNode } from './LemurSummaryNode.js';
import { lemurTaskNode } from './LemurTaskNode.js';
import { lemurActionItemsNode } from './LemurActionItemsNode.js';

export const assemblyAiPlugin: RivetPlugin = {
  id: 'assemblyAi',
  name: 'AssemblyAI',

  register: (register) => {
    register(transcribeAudioNode);
    register(lemurSummaryNode);
    register(lemurQaNode);
    register(lemurTaskNode);
    register(lemurActionItemsNode);
  },

  configSpec: {
    assemblyAiApiKey: {
      type: 'secret',
      label: 'AssemblyAI API Key',
      description: 'The API key for the AssemblyAI service.',
      pullEnvironmentVariable: 'ASSEMBLYAI_API_KEY',
      helperText: 'You may also set the ASSEMBLYAI_API_KEY environment variable.',
    },
  },

  contextMenuGroups: [
    {
      id: 'add-node-group:assemblyai',
      label: 'AssemblyAI',
    },
  ],
};
