import { type RivetPlugin } from '../../index.js';
import { PineconeVectorDatabase } from './PineconeVectorDatabase.js';
import { registerIntegration } from '../../integrations/integrations.js';

export const pineconePlugin: RivetPlugin = {
  id: 'pinecone',
  name: 'Pinecone',

  register: () => {
    registerIntegration('vectorDatabase', 'pinecone', (context) => new PineconeVectorDatabase(context.settings));
  },

  configSpec: {
    pineconeApiKey: {
      type: 'secret',
      label: 'Pinecone API Key',
      description: 'The API key for the Pinecone service.',
      pullEnvironmentVariable: 'PINECONE_API_KEY',
      helperText: 'You may also set the PINECONE_API_KEY environment variable.',
    },
  },
};
