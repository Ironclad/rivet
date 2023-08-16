import { RivetPlugin } from '../../index.js';
import { transcribeAudioNode } from './TranscribeAudioNode.js';

export const assemblyAiPlugin: RivetPlugin = {
  id: 'assemblyAi',
  register: (register) => {
    register(transcribeAudioNode);
  },

  configSpec: {
    assemblyAiApiKey: {
      type: 'string',
      label: 'AssemblyAI API Key',
      description: 'The API key for the AssemblyAI service.',
      pullEnvironmentVariable: 'ASSEMBLYAI_API_KEY',
    },
  },
};
