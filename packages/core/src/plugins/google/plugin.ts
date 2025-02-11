import { type RivetPlugin } from '../../index.js';
import { chatGoogleNode } from './nodes/ChatGoogleNode.js';

export const googlePlugin: RivetPlugin = {
  id: 'google',
  name: 'Google',

  register: (register) => {
    register(chatGoogleNode);
  },

  configSpec: {
    googleApiKey: {
      type: 'secret',
      label: 'Google API Key',
      description: 'The API key for accessing Google generative AI.',
      pullEnvironmentVariable: 'GOOGLE_GENERATIVE_AI_API_KEY',
      helperText: 'You may also set the GOOGLE_GENERATIVE_AI_API_KEY environment variable.',
    },
    googleProjectId: {
      type: 'string',
      label: 'Google Project ID (Deprecated)',
      description: 'The Google project ID.',
      pullEnvironmentVariable: 'GCP_PROJECT',
      helperText: 'Deprecated, use Google API Key instead. You may also set the GCP_PROJECT environment variable.',
    },
    googleRegion: {
      type: 'string',
      label: 'Google Region (Deprecated)',
      description: 'The Google region.',
      pullEnvironmentVariable: 'GCP_REGION',
      helperText: 'Deprecated, use Google API Key instead. You may also set the GCP_REGION environment variable.',
    },
    googleApplicationCredentials: {
      type: 'string',
      label: 'Google Application Credentials (Deprecated)',
      description: 'The path with the JSON file that contains your credentials.',
      pullEnvironmentVariable: 'GOOGLE_APPLICATION_CREDENTIALS',
      helperText:
        'Deprecated, use Google API Key instead. You may also set the GOOGLE_APPLICATION_CREDENTIALS environment variable. See https://cloud.google.com/vertex-ai/docs/start/client-libraries for more info.',
    },
  },
};
