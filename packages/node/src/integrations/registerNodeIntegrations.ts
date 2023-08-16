import { registerIntegration } from '@ironclad/rivet-core';
import { PineconeVectorDatabase } from './pinecone/PineconeVectorDatabase.js';

registerIntegration('vectorDatabase', 'pinecone', (context) => new PineconeVectorDatabase(context.settings));
