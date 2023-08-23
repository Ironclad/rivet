import { RivetPlugin } from '../../index.js';
import { transcribeAudioNode } from './TranscribeAudioNode.js';
import { leMURSummaryNode } from './LeMURSummaryNode.js';

export const assemblyAiPlugin: RivetPlugin = {
  id: 'assemblyAi',
  register: (register) => {
    register(transcribeAudioNode);
    register(leMURSummaryNode);
  },

  configSpec: {
    assemblyAiApiKey: {
      type: 'secret',
      label: 'AssemblyAI API Key',
      description: 'The API key for the AssemblyAI service.',
      pullEnvironmentVariable: 'ASSEMBLYAI_API_KEY',
    },
  },

  contextMenuGroups: [
    {
      id: 'add-node-group:assemblyai',
      label: 'AssemblyAI',
    }
  ]
};
