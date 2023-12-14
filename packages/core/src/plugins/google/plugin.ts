import { type RivetPlugin } from '../../index.js';
import { chatGoogleNode } from './nodes/ChatGoogleNode.js';

export const googlePlugin: RivetPlugin = {
  id: 'google',
  name: 'Google',

  register: (register) => {
    register(chatGoogleNode);
  },

  configSpec: {
    googleProjectId: {
      type: 'string',
      label: 'Google Project ID',
      description: 'The Google project ID.',
      pullEnvironmentVariable: 'GCP_PROJECT',
      helperText: 'You may also set the GCP_PROJECT environment variable.',
    },
    googleRegion: {
      type: 'string',
      label: 'Google Region',
      description: 'The Google region.',
      pullEnvironmentVariable: 'GCP_REGION',
      helperText: 'You may also set the GCP_REGION environment variable.',
    },
    googleApplicationCredentials: {
      type: 'string',
      label: 'Google Application Credentials',
      description: 'The path with the JSON file that contains your credentials.',
      pullEnvironmentVariable: 'GOOGLE_APPLICATION_CREDENTIALS',
      helperText: 'You may also set the GOOGLE_APPLICATION_CREDENTIALS environment variable. See https://cloud.google.com/vertex-ai/docs/start/client-libraries for more info.',
    },
  },
};
