import { type RivetPlugin } from '../../index.js';
import { QdrantVectorDatabase } from './QdrantVectorDatabase.js';
import { registerIntegration } from '../../integrations/integrations.js';

export const qdrantPlugin: RivetPlugin = {
  id: 'qdrant',
  name: 'Qdrant',

  register: () => {
    registerIntegration('vectorDatabase', 'qdrant', (context) => new QdrantVectorDatabase(context.settings));
  },

  configSpec: {
    qdrantApiKey: {
      type: 'secret',
      label: 'Qdrant API Key',
      description: 'The API key for the Qdrant service.',
      pullEnvironmentVariable: 'QDRANT_API_KEY',
      helperText: 'You may also set the QDRANT_API_KEY environment variable.',
    },
    qdrantUrl: {
      type: 'string',
      label: 'Qdrant REST URL',
      description: 'The URL for the Qdrant service.',
      pullEnvironmentVariable: 'QDRANT_URL',
      helperText: 'You may also set the QDRANT_URL environment variable.',
    },
  },
};
